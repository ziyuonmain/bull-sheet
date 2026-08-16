import unittest

class TestBobs27Engine:
    def __init__(self, players=None):
        players_list = players or [{'name': 'Player 1'}]
        self.mode = 'bobs27'
        self.total_rounds = 21
        self.current_round = 1
        self.active_player_index = 0
        self.turn_darts = []
        self.is_match_over = False
        self.winner = None
        self.history = []

        self.players = [{
            'name': p['name'],
            'score': 27,
            'is_eliminated': False,
            'eliminated_round': None,
            'hits_this_round': 0,
            'round_points': 0,
            'total_doubles_hit': 0,
            'total_darts_thrown': 0,
            'turns': []
        } for p in players_list]

    def get_target_for_round(self, round_num):
        if 1 <= round_num <= 20:
            return {'number': round_num, 'mult': 2, 'label': f'D{round_num}', 'value': round_num * 2}
        return {'number': 25, 'mult': 2, 'label': 'Bull', 'value': 50}

    def get_current_target(self):
        return self.get_target_for_round(self.current_round)

    def get_active_player(self):
        return self.players[self.active_player_index]

    def is_hit(self, dart, target):
        if not dart or dart.get('number', 0) == 0:
            return False
        if target['number'] == 25:
            return (dart.get('number') == 25 and dart.get('mult') == 2) or dart.get('score') == 50
        return int(dart.get('number', 0)) == int(target['number']) and int(dart.get('mult', 1)) == 2

    def record_dart(self, dart):
        if self.is_match_over:
            return None

        if len(self.turn_darts) >= 3:
            adv = self.finish_turn()
            if adv and adv.get('type') == 'match_win':
                return adv

        player = self.get_active_player()
        target = self.get_current_target()
        hit = self.is_hit(dart, target)

        dart_obj = {
            'number': dart.get('number', 0),
            'mult': dart.get('mult', 1),
            'score': dart.get('score', dart.get('number', 0) * dart.get('mult', 1)),
            'is_hit': hit
        }
        self.turn_darts.append(dart_obj)
        player['total_darts_thrown'] += 1

        if hit:
            player['hits_this_round'] += 1
            player['round_points'] += target['value']
            player['total_doubles_hit'] += 1

        if len(self.turn_darts) == 3:
            if player['hits_this_round'] > 0:
                delta = player['round_points']
            else:
                delta = -target['value']

            player['score'] += delta
            player['turns'].append(delta)

            if player['score'] <= 0:
                player['is_eliminated'] = True
                player['eliminated_round'] = self.current_round

            ended = self.check_match_completion()

            return {
                'type': 'match_win' if ended else 'visit_complete',
                'player': player,
                'delta': delta,
                'remaining': player['score'],
                'is_eliminated': player['is_eliminated'],
                'is_match_over': self.is_match_over,
                'winner': self.winner
            }

        return {'type': 'dart_recorded', 'player': player, 'remaining': player['score']}

    def finish_turn(self):
        if self.is_match_over:
            return {'type': 'match_win', 'winner': self.winner}

        self.turn_darts = []
        player = self.get_active_player()
        player['hits_this_round'] = 0
        player['round_points'] = 0

        next_idx = self.active_player_index + 1
        if next_idx >= len(self.players):
            next_idx = 0
            self.current_round += 1

        # Skip eliminated in multiplayer
        active_survivors = [p for p in self.players if not p['is_eliminated']]
        if 0 < len(active_survivors) < len(self.players):
            attempts = 0
            while self.players[next_idx]['is_eliminated'] and attempts < len(self.players):
                next_idx = (next_idx + 1) % len(self.players)
                if next_idx == 0:
                    self.current_round += 1
                attempts += 1

        self.active_player_index = next_idx

        if self.current_round > self.total_rounds or self.check_match_completion():
            self.finish_match()
            return {'type': 'match_win', 'winner': self.winner}

        return {'type': 'turn_advanced', 'active_player': self.get_active_player(), 'current_round': self.current_round}

    def check_match_completion(self):
        survivors = [p for p in self.players if not p['is_eliminated']]
        if len(survivors) == 0 or self.current_round > self.total_rounds:
            self.finish_match()
            return True
        return False

    def finish_match(self):
        self.is_match_over = True
        sorted_p = sorted(self.players, key=lambda p: (not p['is_eliminated'], p['score']), reverse=True)
        self.winner = sorted_p[0]


class Bobs27E2ETests(unittest.TestCase):
    def test_full_progression_and_scoring(self):
        game = TestBobs27Engine(players=[{'name': 'Alice'}])
        self.assertEqual(game.players[0]['score'], 27)
        self.assertEqual(game.get_current_target()['label'], 'D1')

        # Round 1: D1 - Hit 2 darts (2 * 2 = +4) -> Score 31
        game.record_dart({'number': 1, 'mult': 2, 'score': 2})
        game.record_dart({'number': 1, 'mult': 2, 'score': 2})
        res1 = game.record_dart({'number': 0, 'mult': 0, 'score': 0})
        self.assertEqual(res1['type'], 'visit_complete')
        self.assertEqual(game.players[0]['score'], 31)

        # Advance to Round 2 (D2)
        adv = game.finish_turn()
        self.assertEqual(adv['current_round'], 2)
        self.assertEqual(game.get_current_target()['label'], 'D2')

        # Round 2: D2 - Miss all 3 -> -4 pts -> Score 27
        game.record_dart({'number': 2, 'mult': 1, 'score': 2})
        game.record_dart({'number': 2, 'mult': 1, 'score': 2})
        res2 = game.record_dart({'number': 2, 'mult': 1, 'score': 2})
        self.assertEqual(res2['type'], 'visit_complete')
        self.assertEqual(game.players[0]['score'], 27)

    def test_knockout_on_zero_or_below(self):
        game = TestBobs27Engine(players=[{'name': 'Bob'}])
        game.players[0]['score'] = 10 # Set low score
        game.current_round = 10 # Target D10 (value 20)

        # Miss all 3 -> -20 pts -> Drops from 10 to -10 -> Knockout Game Over!
        for _ in range(2):
            game.record_dart({'number': 0, 'mult': 0, 'score': 0})
        final_res = game.record_dart({'number': 0, 'mult': 0, 'score': 0})

        self.assertEqual(final_res['type'], 'match_win')
        self.assertTrue(game.is_match_over)
        self.assertTrue(game.players[0]['is_eliminated'])
        self.assertEqual(game.players[0]['score'], -10)

    def test_round_21_bullseye_finish(self):
        game = TestBobs27Engine(players=[{'name': 'Master'}])
        game.current_round = 21
        self.assertEqual(game.get_current_target()['label'], 'Bull')
        self.assertEqual(game.get_current_target()['value'], 50)

        # Hit 1 Bull -> +50 pts -> 27 + 50 = 77
        game.record_dart({'number': 25, 'mult': 2, 'score': 50})
        game.record_dart({'number': 0, 'mult': 0, 'score': 0})
        res = game.record_dart({'number': 0, 'mult': 0, 'score': 0})
        self.assertEqual(game.players[0]['score'], 77)

if __name__ == '__main__':
    unittest.main()
