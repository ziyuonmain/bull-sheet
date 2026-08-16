import math
import unittest

print("=" * 70)
print("🎯 BULLSHEET EXHAUSTIVE GAME MECHANICS & ROUND TERMINATION SUITE")
print("=" * 70)

# --- 1. Split Score (Halve-It) Engine Simulator ---
class SplitScoreEngine:
    def __init__(self, start_score=40, rounds_list=None, players=None):
        self.start_score = start_score
        self.rounds = rounds_list or [
            {'id': '15', 'label': '15', 'targetType': 'num', 'value': 15},
            {'id': '16', 'label': '16', 'targetType': 'num', 'value': 16},
            {'id': 'doubles', 'label': 'ANY DOUBLE', 'targetType': 'double'},
            {'id': 'bull', 'label': 'BULLSEYE', 'targetType': 'bull', 'value': 25}
        ]
        self.current_round_idx = 0
        self.players = [{'name': p, 'score': start_score, 'hitsThisRound': 0, 'totalDarts': 0} for p in (players or ['Alice', 'Bob'])]
        self.active_player_idx = 0
        self.turn_darts = []
        self.history = []
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
        if self.is_match_over:
            return None

        if len(self.turn_darts) >= 3:
            finish_res = self.finish_turn()
            if finish_res and finish_res.get('type') == 'match_win':
                return finish_res

        player = self.get_active_player()
        round_info = self.get_current_round()
        hit = self.is_dart_target_hit(dart, round_info)
        points = (int(dart.get('score', 0)) or (int(dart['number']) * int(dart.get('mult', 1)))) if hit else 0

        self.history.append({
            'playerIdx': self.active_player_idx,
            'roundIdx': self.current_round_idx,
            'dart': dict(dart),
            'isHit': hit,
            'points': points,
            'prevScore': player['score'],
            'prevHits': player['hitsThisRound'],
            'turnDartsSnapshot': [dict(d) for d in self.turn_darts],
            'playersSnapshot': [{'score': p['score'], 'hitsThisRound': p['hitsThisRound'], 'totalDarts': p['totalDarts']} for p in self.players]
        })

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


# --- 2. Highscore Engine Simulator ---
class HighscoreEngine:
    def __init__(self, rounds=3, players=None):
        self.max_rounds = rounds
        self.current_round = 1
        self.players = [{'name': p, 'score': 0, 'totalDarts': 0} for p in (players or ['Alice', 'Bob'])]
        self.active_player_idx = 0
        self.turn_darts = []
        self.history = []
        self.is_match_over = False
        self.winner = None

    def get_active_player(self):
        return self.players[self.active_player_idx]

    def record_dart(self, dart):
        if self.is_match_over:
            return None

        if len(self.turn_darts) >= 3:
            finish_res = self.finish_turn()
            if finish_res and finish_res.get('type') == 'match_win':
                return finish_res

        player = self.get_active_player()
        score_val = int(dart.get('score', 0)) or (int(dart['number']) * int(dart.get('mult', 1)))

        player['score'] += score_val
        player['totalDarts'] += 1
        self.turn_darts.append(dart)

        if len(self.turn_darts) == 3:
            turn_score = sum(int(d.get('score', 0)) or (int(d['number']) * int(d.get('mult', 1))) for d in self.turn_darts)
            return {'type': 'visit_complete', 'player': player, 'turnScore': turn_score, 'score': player['score']}

        return {'type': 'dart_recorded', 'player': player, 'score': player['score']}

    def finish_turn(self):
        self.turn_darts = []
        self.active_player_idx += 1
        if self.active_player_idx >= len(self.players):
            self.active_player_idx = 0
            self.current_round += 1
            if self.current_round > self.max_rounds:
                self.is_match_over = True
                self.current_round = self.max_rounds
                winner = max(self.players, key=lambda p: p['score'])
                self.winner = winner
                return {'type': 'match_win', 'winner': winner, 'players': self.players}

        return {'type': 'turn_advanced', 'activePlayer': self.get_active_player()}


class MechanicsTestSuite(unittest.TestCase):

    def test_split_score_visit_complete_and_finish_turn(self):
        print("\n--- Test: Split Score Visit Complete & Paced Turn Finish ---")
        game = SplitScoreEngine(start_score=40, rounds_list=[
            {'id': '15', 'targetType': 'num', 'value': 15},
            {'id': '16', 'targetType': 'num', 'value': 16}
        ], players=['Player 1', 'Player 2'])

        # Round 1: Player 1 throws S15, S10, S2
        game.record_dart({'number': 15, 'mult': 1, 'score': 15})
        game.record_dart({'number': 10, 'mult': 1, 'score': 10})
        res = game.record_dart({'number': 2, 'mult': 1, 'score': 2})
        
        # 3rd dart emits visit_complete so slots remain visible!
        self.assertEqual(res['type'], 'visit_complete')
        self.assertEqual(len(game.turn_darts), 3)
        self.assertEqual(game.players[0]['score'], 55)

        # Explicitly advance turn
        adv_res = game.finish_turn()
        self.assertEqual(adv_res['type'], 'turn_advanced')
        self.assertEqual(game.active_player_idx, 1)

        # Player 2 throws 3 misses -> Halved from 40 to 20
        game.record_dart({'number': 20, 'mult': 1, 'score': 20})
        game.record_dart({'number': 1, 'mult': 1, 'score': 1})
        res2 = game.record_dart({'number': 5, 'mult': 1, 'score': 5})
        self.assertEqual(res2['type'], 'visit_complete')
        self.assertTrue(res2['halved'])
        self.assertEqual(game.players[1]['score'], 20)
        game.finish_turn()

        # Round 2: Final Round
        # Player 1 throws 3x S16 = 55 + 48 = 103 pts
        for _ in range(3): game.record_dart({'number': 16, 'mult': 1, 'score': 16})
        game.finish_turn()

        # Player 2 throws 3 misses -> Halved from 20 to 10
        for _ in range(3): game.record_dart({'number': 1, 'mult': 1, 'score': 1})
        
        # When finishing the final round visit -> match_win
        final_res = game.finish_turn()
        self.assertIsNotNone(final_res)
        self.assertEqual(final_res['type'], 'match_win')
        self.assertTrue(game.is_match_over)
        self.assertEqual(game.current_round_idx, 1) # Clamped!
        self.assertEqual(final_res['winner']['name'], 'Player 1')
        print(f"✅ Verified: Split Score ends cleanly on max round with winner {final_res['winner']['name']} (103 pts)!")

    def test_highscore_pacing_and_termination(self):
        print("\n--- Test: Highscore Visit Pacing & Clamped Termination ---")
        game = HighscoreEngine(rounds=2, players=['Player 1', 'Player 2'])

        # Round 1
        for _ in range(3): game.record_dart({'number': 20, 'mult': 3, 'score': 60})
        game.finish_turn()
        for _ in range(3): game.record_dart({'number': 20, 'mult': 1, 'score': 20})
        game.finish_turn()

        # Round 2 (Final)
        for _ in range(3): game.record_dart({'number': 20, 'mult': 3, 'score': 60})
        game.finish_turn()
        for _ in range(3): game.record_dart({'number': 19, 'mult': 3, 'score': 57})
        
        final_res = game.finish_turn()
        self.assertEqual(final_res['type'], 'match_win')
        self.assertTrue(game.is_match_over)
        self.assertEqual(game.current_round, 2) # Clamped to 2 of 2!
        self.assertEqual(final_res['winner']['name'], 'Player 1')
        print("✅ Verified: Highscore stays clamped to Round 2 of 2 and declares winner cleanly!")


if __name__ == '__main__':
    unittest.main()
