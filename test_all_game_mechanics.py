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

            finish_res = self.finish_turn()
            if finish_res and finish_res.get('type') == 'match_win':
                return finish_res

            return {
                'type': 'turn_end',
                'player': player,
                'halved': halved,
                'turnScore': turn_score,
                'score': player['score']
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
                winner = max(self.players, key=lambda p: p['score'])
                self.winner = winner
                return {'type': 'match_win', 'winner': winner, 'players': self.players}

    def undo(self):
        if not self.history:
            return None
        last = self.history.pop()
        self.active_player_idx = last['playerIdx']
        self.current_round_idx = last['roundIdx']
        for idx, p in enumerate(self.players):
            snap = last['playersSnapshot'][idx]
            p['score'] = snap['score']
            p['hitsThisRound'] = snap['hitsThisRound']
            p['totalDarts'] = snap['totalDarts']
        self.turn_darts = last['turnDartsSnapshot']
        self.is_match_over = False
        self.winner = None
        return {'player': self.get_active_player(), 'score': self.get_active_player()['score']}


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

        player = self.get_active_player()
        score_val = int(dart.get('score', 0)) or (int(dart['number']) * int(dart.get('mult', 1)))

        self.history.append({
            'playerIdx': self.active_player_idx,
            'round': self.current_round,
            'dart': dict(dart),
            'scoreVal': score_val,
            'prevScore': player['score'],
            'turnDartsSnapshot': [dict(d) for d in self.turn_darts],
            'playersSnapshot': [{'score': p['score'], 'totalDarts': p['totalDarts']} for p in self.players]
        })

        player['score'] += score_val
        player['totalDarts'] += 1
        self.turn_darts.append(dart)

        if len(self.turn_darts) == 3:
            turn_score = sum(int(d.get('score', 0)) or (int(d['number']) * int(d.get('mult', 1))) for d in self.turn_darts)
            finish_res = self.finish_turn()
            if finish_res and finish_res.get('type') == 'match_win':
                return finish_res
            return {'type': 'turn_end', 'player': player, 'turnScore': turn_score, 'score': player['score']}

        return {'type': 'dart_recorded', 'player': player, 'score': player['score']}

    def finish_turn(self):
        self.turn_darts = []
        self.active_player_idx += 1
        if self.active_player_idx >= len(self.players):
            self.active_player_idx = 0
            self.current_round += 1
            if self.current_round > self.max_rounds:
                self.is_match_over = True
                winner = max(self.players, key=lambda p: p['score'])
                self.winner = winner
                return {'type': 'match_win', 'winner': winner, 'players': self.players}

    def undo(self):
        if not self.history:
            return None
        last = self.history.pop()
        self.active_player_idx = last['playerIdx']
        self.current_round = last['round']
        for idx, p in enumerate(self.players):
            snap = last['playersSnapshot'][idx]
            p['score'] = snap['score']
            p['totalDarts'] = snap['totalDarts']
        self.turn_darts = last['turnDartsSnapshot']
        self.is_match_over = False
        self.winner = None
        return {'player': self.get_active_player(), 'score': self.get_active_player()['score']}


# --- 3. Shanghai Engine Simulator ---
class ShanghaiEngine:
    def __init__(self, rounds=3, players=None):
        self.max_rounds = rounds
        self.current_round = 1
        self.players = [{'name': p, 'score': 0, 'totalDarts': 0} for p in (players or ['Alice', 'Bob'])]
        self.active_player_idx = 0
        self.turn_darts = []
        self.is_match_over = False
        self.winner = None

    def record_dart(self, dart):
        if self.is_match_over:
            return None

        player = self.players[self.active_player_idx]
        target = self.current_round
        dart_num = int(dart['number'])
        dart_mult = int(dart.get('mult', 1))

        points = (dart_num * dart_mult) if dart_num == target else 0
        player['score'] += points
        player['totalDarts'] += 1
        self.turn_darts.append({'number': dart_num, 'mult': dart_mult, 'points': points})

        # Instant Shanghai Check: Single, Double, Treble of target in same visit
        target_darts = [d for d in self.turn_darts if d['number'] == target]
        has_s = any(d['mult'] == 1 for d in target_darts)
        has_d = any(d['mult'] == 2 for d in target_darts)
        has_t = any(d['mult'] == 3 for d in target_darts)

        if has_s and has_d and has_t:
            self.is_match_over = True
            self.winner = player
            return {'type': 'match_win', 'winner': player, 'shanghaiWin': True}

        if len(self.turn_darts) == 3:
            turn_score = sum(d['points'] for d in self.turn_darts)
            self.turn_darts = []
            self.active_player_idx += 1
            if self.active_player_idx >= len(self.players):
                self.active_player_idx = 0
                self.current_round += 1
                if self.current_round > self.max_rounds:
                    self.is_match_over = True
                    self.winner = max(self.players, key=lambda p: p['score'])
                    return {'type': 'match_win', 'winner': self.winner}
            return {'type': 'turn_end', 'player': player, 'turnScore': turn_score}

        return {'type': 'dart_recorded', 'player': player, 'score': player['score']}


# --- 4. Killer Engine Simulator ---
class KillerEngine:
    def __init__(self, starting_lives=3, targets=(18, 14)):
        self.players = [
            {'name': 'Alice', 'target': targets[0], 'isKiller': False, 'lives': starting_lives, 'isEliminated': False},
            {'name': 'Bob', 'target': targets[1], 'isKiller': False, 'lives': starting_lives, 'isEliminated': False}
        ]
        self.active_player_idx = 0
        self.turn_darts = []
        self.is_match_over = False
        self.winner = None

    def record_dart(self, dart):
        if self.is_match_over:
            return None
        player = self.players[self.active_player_idx]
        dart_num = int(dart['number'])
        dart_mult = int(dart.get('mult', 1))
        self.turn_darts.append(dart)

        if not player['isKiller']:
            if dart_num == player['target'] and dart_mult >= 2:
                player['isKiller'] = True
        else:
            for opp in self.players:
                if not opp['isEliminated'] and opp['target'] == dart_num and opp != player:
                    opp['lives'] = max(0, opp['lives'] - dart_mult)
                    if opp['lives'] == 0:
                        opp['isEliminated'] = True

        survivors = [p for p in self.players if not p['isEliminated']]
        if len(survivors) == 1:
            self.is_match_over = True
            self.winner = survivors[0]
            return {'type': 'match_win', 'winner': survivors[0]}

        if len(self.turn_darts) == 3:
            self.turn_darts = []
            while True:
                self.active_player_idx = (self.active_player_idx + 1) % len(self.players)
                if not self.players[self.active_player_idx]['isEliminated'] or self.is_match_over:
                    break
            return {'type': 'turn_end', 'player': player}

        return {'type': 'dart_recorded', 'player': player}


# =========================================================================
# TEST RUNNER
# =========================================================================

class MechanicsTestSuite(unittest.TestCase):

    def test_split_score_max_rounds_termination(self):
        print("\n--- Test: Split Score Round Termination & Halving ---")
        game = SplitScoreEngine(start_score=40, rounds_list=[
            {'id': '15', 'targetType': 'num', 'value': 15},
            {'id': '16', 'targetType': 'num', 'value': 16}
        ], players=['Player 1', 'Player 2'])

        # Round 1: Target 15
        # Player 1 hits S15, S10, S2 -> 55 pts (Safe)
        game.record_dart({'number': 15, 'mult': 1, 'score': 15})
        game.record_dart({'number': 10, 'mult': 1, 'score': 10})
        res = game.record_dart({'number': 2, 'mult': 1, 'score': 2})
        self.assertEqual(res['type'], 'turn_end')
        self.assertEqual(game.players[0]['score'], 55)
        self.assertFalse(res['halved'])

        # Player 2 hits S20, S1, S5 -> 0 hits -> Halved from 40 to 20!
        game.record_dart({'number': 20, 'mult': 1, 'score': 20})
        game.record_dart({'number': 1, 'mult': 1, 'score': 1})
        res2 = game.record_dart({'number': 5, 'mult': 1, 'score': 5})
        self.assertEqual(res2['type'], 'turn_end')
        self.assertEqual(game.players[1]['score'], 20)
        self.assertTrue(res2['halved'])

        # Round 2: Target 16 (Final Round!)
        # Player 1 throws S16, S16, S16 -> 55 + 48 = 103 pts
        game.record_dart({'number': 16, 'mult': 1, 'score': 16})
        game.record_dart({'number': 16, 'mult': 1, 'score': 16})
        res3 = game.record_dart({'number': 16, 'mult': 1, 'score': 16})
        self.assertEqual(res3['type'], 'turn_end')
        self.assertEqual(game.players[0]['score'], 103)

        # Player 2 throws 3 misses -> Halved from 20 to 10
        game.record_dart({'number': 1, 'mult': 1, 'score': 1})
        game.record_dart({'number': 2, 'mult': 1, 'score': 2})
        final_res = game.record_dart({'number': 3, 'mult': 1, 'score': 3})

        # MUST BE MATCH WIN!
        self.assertIsNotNone(final_res)
        self.assertEqual(final_res['type'], 'match_win', "Split score did NOT terminate on final round!")
        self.assertTrue(game.is_match_over)
        self.assertEqual(final_res['winner']['name'], 'Player 1')
        print(f"✅ Verified: Split Score ends on max round with winner {final_res['winner']['name']} ({final_res['winner']['score']} pts)!")

    def test_highscore_max_rounds_termination(self):
        print("\n--- Test: Highscore Max Rounds Termination ---")
        game = HighscoreEngine(rounds=2, players=['Player 1', 'Player 2'])

        # Round 1
        for _ in range(3): game.record_dart({'number': 20, 'mult': 3, 'score': 60}) # P1 = 180
        for _ in range(3): game.record_dart({'number': 20, 'mult': 1, 'score': 20}) # P2 = 60

        # Round 2 (Final Round!)
        for _ in range(3): game.record_dart({'number': 20, 'mult': 3, 'score': 60}) # P1 = 360
        game.record_dart({'number': 19, 'mult': 3, 'score': 57})
        game.record_dart({'number': 19, 'mult': 3, 'score': 57})
        final_res = game.record_dart({'number': 19, 'mult': 3, 'score': 57})

        self.assertIsNotNone(final_res)
        self.assertEqual(final_res['type'], 'match_win', "Highscore did NOT terminate on round 2!")
        self.assertTrue(game.is_match_over)
        self.assertEqual(final_res['winner']['name'], 'Player 1')
        print(f"✅ Verified: Highscore cleanly ends after max rounds with winner {final_res['winner']['name']}!")

    def test_shanghai_instant_win(self):
        print("\n--- Test: Shanghai Instant Win Mechanics ---")
        game = ShanghaiEngine(rounds=7, players=['Player 1', 'Player 2'])

        # Player 1 hits S1, D1, T1 in Round 1 -> Instant Win!
        game.record_dart({'number': 1, 'mult': 1})
        game.record_dart({'number': 1, 'mult': 2})
        win_res = game.record_dart({'number': 1, 'mult': 3})

        self.assertIsNotNone(win_res)
        self.assertEqual(win_res['type'], 'match_win')
        self.assertTrue(win_res.get('shanghaiWin'))
        self.assertTrue(game.is_match_over)
        print("✅ Verified: Shanghai Instant Win (Single + Double + Treble in 1 visit) triggers immediate victory!")

    def test_killer_elimination_and_win(self):
        print("\n--- Test: Killer Elimination & Win Mechanics ---")
        game = KillerEngine(starting_lives=2, targets=(18, 14))

        # Alice qualifies as Killer (hits D18)
        game.record_dart({'number': 18, 'mult': 2})
        game.record_dart({'number': 18, 'mult': 1})
        game.record_dart({'number': 18, 'mult': 1})
        self.assertTrue(game.players[0]['isKiller'])

        # Bob misses D14
        game.record_dart({'number': 14, 'mult': 1})
        game.record_dart({'number': 14, 'mult': 1})
        game.record_dart({'number': 14, 'mult': 1})
        self.assertFalse(game.players[1]['isKiller'])

        # Alice hits Bob's #14 with Double -> Bob loses 2 lives -> Bob eliminated -> Alice wins!
        win_res = game.record_dart({'number': 14, 'mult': 2})
        self.assertEqual(win_res['type'], 'match_win')
        self.assertEqual(win_res['winner']['name'], 'Alice')
        self.assertTrue(game.players[1]['isEliminated'])
        print("✅ Verified: Killer elimination and last-survivor win triggers properly!")


if __name__ == '__main__':
    unittest.main()
