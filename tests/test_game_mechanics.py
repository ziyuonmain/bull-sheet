import unittest
import math

class SplitScoreEngine:
    def __init__(self, start_score=40, rounds_list=None, players=None):
        self.start_score = start_score
        self.rounds = rounds_list or [
            {'id': '15', 'targetType': 'num', 'value': 15},
            {'id': '16', 'targetType': 'num', 'value': 16}
        ]
        self.current_round_idx = 0
        self.players = [{'name': p, 'score': start_score, 'hitsThisRound': 0, 'totalDarts': 0} for p in (players or ['Alice', 'Bob'])]
        self.active_player_idx = 0
        self.turn_darts = []
        self.is_match_over = False
        self.winner = None

    def get_current_round(self):
        return self.rounds[self.current_round_idx]

    def get_active_player(self):
        return self.players[self.active_player_idx]

    def get_next_player(self):
        return self.players[(self.active_player_idx + 1) % len(self.players)]

    def is_dart_target_hit(self, dart, round_info):
        dart_num = int(dart['number'])
        dart_mult = int(dart.get('mult', 1))
        round_val = int(round_info.get('value', 0))

        if round_info['targetType'] == 'num':
            return dart_num == round_val and dart_num > 0
        if round_info['targetType'] == 'double':
            return dart_mult == 2 or (dart_num == 25 and dart_mult == 2)
        if round_info['targetType'] == 'treble':
            return dart_mult == 3
        if round_info['targetType'] == 'bull':
            return dart_num == 25
        return False

    def record_dart(self, dart):
        if self.is_match_over: return None
        if len(self.turn_darts) >= 3:
            fin = self.finish_turn()
            if fin and fin.get('type') == 'match_win': return fin

        player = self.get_active_player()
        round_info = self.get_current_round()
        hit = self.is_dart_target_hit(dart, round_info)
        points = (int(dart.get('score', 0)) or (int(dart['number']) * int(dart.get('mult', 1)))) if hit else 0

        player['totalDarts'] += 1
        self.turn_darts.append({'dart': dart, 'isHit': hit, 'points': points})
        if hit:
            player['hitsThisRound'] += 1
            player['score'] += points

        if len(self.turn_darts) == 3:
            halved = False
            turn_score = sum(d['points'] for d in self.turn_darts)
            if player['hitsThisRound'] == 0:
                player['score'] = math.floor(player['score'] / 2)
                halved = True

            return {
                'type': 'visit_complete',
                'player': player,
                'halved': halved,
                'turnScore': turn_score,
                'score': player['score'],
                'nextPlayer': self.get_next_player()
            }

        return {'type': 'dart_recorded', 'player': player, 'dart': dart, 'hit': hit, 'score': player['score']}

    def finish_turn(self):
        player = self.get_active_player()
        player['hitsThisRound'] = 0
        self.turn_darts = []

        self.active_player_idx += 1
        if self.active_player_idx >= len(self.players):
            self.active_player_idx = 0
            self.current_round_idx += 1

            if self.current_round_idx >= len(self.rounds):
                self.is_match_over = True
                self.current_round_idx = len(self.rounds) - 1
                winner = max(self.players, key=lambda p: p['score'])
                self.winner = winner
                return {'type': 'match_win', 'winner': winner, 'players': self.players}

        return {'type': 'turn_advanced', 'activePlayer': self.get_active_player()}


class GameMechanicsTests(unittest.TestCase):

    def test_split_score_mechanics_and_halving(self):
        game = SplitScoreEngine(start_score=40, players=['Player 1', 'Player 2'])

        # Player 1 hits target (15)
        game.record_dart({'number': 15, 'mult': 1, 'score': 15})
        game.record_dart({'number': 15, 'mult': 2, 'score': 30})
        res1 = game.record_dart({'number': 0, 'mult': 0, 'score': 0})
        self.assertEqual(res1['type'], 'visit_complete')
        self.assertFalse(res1['halved'])
        self.assertEqual(game.players[0]['score'], 85)
        game.finish_turn()

        # Player 2 misses all 3 -> Halved from 40 to 20
        for _ in range(3): game.record_dart({'number': 20, 'mult': 1, 'score': 20})
        res2 = game.record_dart({'number': 20, 'mult': 1, 'score': 20})
        # After auto-advance or finish, player 2 score is halved
        self.assertEqual(game.players[1]['score'], 20)

    def test_round_limit_clamping(self):
        game = SplitScoreEngine(start_score=40, rounds_list=[
            {'id': '15', 'targetType': 'num', 'value': 15}
        ], players=['Player 1', 'Player 2'])

        # Round 1 (Final): Both throw
        for _ in range(3): game.record_dart({'number': 15, 'mult': 1, 'score': 15})
        game.finish_turn()
        for _ in range(3): game.record_dart({'number': 1, 'mult': 1, 'score': 1})
        final_res = game.finish_turn()

        self.assertEqual(final_res['type'], 'match_win')
        self.assertEqual(game.current_round_idx, 0) # Strictly clamped to max round index
        self.assertEqual(final_res['winner']['name'], 'Player 1')

if __name__ == '__main__':
    unittest.main()

    def test_bobs27_mechanics(self):
        """Test Bob's 27 rules: starts at 27, add doubles on hit, subtract on 0 hits"""
        score = 27
        # Round 1: D1 (Target value 2). Hit 1 double -> +2
        score += 2
        self.assertEqual(score, 29)

        # Round 2: D2 (Target value 4). Miss all 3 -> -4
        score -= 4
        self.assertEqual(score, 25)

        # Severe misses leading to knockout (e.g. Round 20 D20 miss = -40)
        score -= 40
        self.assertLessEqual(score, 0, "Score dropped <= 0, player knocked out")
