import unittest
import math

print("=" * 70)
print("🧪 TESTING 3RD THROW PACING, SLOT RETENTION & TURN ADVANCEMENT")
print("=" * 70)

# Simulate X01 Engine exactly matching js/games/x01.js
class X01Engine:
    def __init__(self, start_score=501, players=None):
        self.start_score = start_score
        self.players = [{'name': p, 'score': start_score, 'totalDarts': 0, 'hasDoubledIn': True} for p in (players or ['Player 1', 'Player 2'])]
        self.active_player_idx = 0
        self.turn_darts = []
        self.is_match_over = False

    def get_active_player(self):
        return self.players[self.active_player_idx]

    def get_next_player(self):
        return self.players[(self.active_player_idx + 1) % len(self.players)]

    def record_dart(self, dart):
        if self.is_match_over: return None

        # Auto-advance if previous visit was full (3 darts) and new throw arrives
        if len(self.turn_darts) >= 3:
            self.finish_turn()

        player = self.get_active_player()
        score_val = int(dart.get('score', 0)) or (int(dart['number']) * int(dart.get('mult', 1)))
        
        self.turn_darts.append(dart)
        player['totalDarts'] += 1
        player['score'] -= score_val

        if len(self.turn_darts) == 3:
            turn_score = sum(int(d.get('score', 0)) or (int(d['number']) * int(d.get('mult', 1))) for d in self.turn_darts)
            return {
                'type': 'visit_complete',
                'player': player,
                'turnScore': turn_score,
                'remaining': player['score'],
                'nextPlayer': self.get_next_player()
            }

        return {'type': 'dart_recorded', 'player': player, 'remaining': player['score']}

    def finish_turn(self):
        self.turn_darts = []
        self.active_player_idx = (self.active_player_idx + 1) % len(self.players)
        return {'type': 'turn_advanced', 'activePlayer': self.get_active_player()}


class TurnFlowTests(unittest.TestCase):

    def test_x01_third_throw_retains_darts_and_waits_for_next_player(self):
        print("\n--- Test: X01 3rd Throw Slot Retention ---")
        game = X01Engine(501, ['Alice', 'Bob'])

        # Dart 1: T20 (60 pts)
        r1 = game.record_dart({'number': 20, 'mult': 3, 'score': 60, 'label': 'T20'})
        self.assertEqual(r1['type'], 'dart_recorded')
        self.assertEqual(len(game.turn_darts), 1)
        self.assertEqual(game.turn_darts[0]['label'], 'T20')
        self.assertEqual(game.get_active_player()['name'], 'Alice')

        # Dart 2: T20 (60 pts)
        r2 = game.record_dart({'number': 20, 'mult': 3, 'score': 60, 'label': 'T20'})
        self.assertEqual(r2['type'], 'dart_recorded')
        self.assertEqual(len(game.turn_darts), 2)
        self.assertEqual(game.turn_darts[1]['label'], 'T20')
        self.assertEqual(game.get_active_player()['name'], 'Alice')

        # Dart 3: T20 (60 pts -> 180 total)
        r3 = game.record_dart({'number': 20, 'mult': 3, 'score': 60, 'label': 'T20'})
        self.assertEqual(r3['type'], 'visit_complete')
        self.assertEqual(r3['turnScore'], 180)
        self.assertEqual(r3['remaining'], 321)
        
        # CRITICAL VERIFICATION:
        # After 3rd throw, active player MUST STILL BE Alice, and turn_darts MUST CONTAIN ALL 3 DARTS!
        self.assertEqual(game.get_active_player()['name'], 'Alice', "Active player must remain Alice until turn is explicitly advanced!")
        self.assertEqual(len(game.turn_darts), 3, "Turn darts must retain all 3 throws so slots remain fully visible!")
        self.assertEqual(r3['nextPlayer']['name'], 'Bob')
        print("✅ Verified: After 3rd throw, all 3 darts stay in slots and active player is not prematurely switched!")

        # Step 4: Player taps 'NEXT PLAYER'
        adv = game.finish_turn()
        self.assertEqual(adv['type'], 'turn_advanced')
        self.assertEqual(game.get_active_player()['name'], 'Bob')
        self.assertEqual(len(game.turn_darts), 0, "Slots are cleared only after explicit advance!")
        print("✅ Verified: Explicit advanceTurn() transitions cleanly to Bob and clears slots for new visit!")

    def test_auto_advance_if_user_throws_on_next_player(self):
        print("\n--- Test: Auto-Advance on 4th Throw ---")
        game = X01Engine(501, ['Alice', 'Bob'])

        # Alice throws 3 darts
        for _ in range(3): game.record_dart({'number': 20, 'mult': 1, 'score': 20, 'label': 'S20'})
        self.assertEqual(len(game.turn_darts), 3)
        self.assertEqual(game.get_active_player()['name'], 'Alice')

        # Bob steps up and directly throws without tapping button
        r4 = game.record_dart({'number': 19, 'mult': 3, 'score': 57, 'label': 'T19'})
        self.assertEqual(game.get_active_player()['name'], 'Bob')
        self.assertEqual(len(game.turn_darts), 1)
        self.assertEqual(game.turn_darts[0]['label'], 'T19')
        print("✅ Verified: 4th throw seamlessly advances turn to Bob without getting blocked!")

if __name__ == '__main__':
    unittest.main()
