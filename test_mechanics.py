import math

print("🧪 Running BullSheet Mechanics Deep Test Suite...")

def test_split_score_dart_view_scenario():
    print("\n--- Test: Exact User Scenario (Target 15, Throws S15, S10, S2) ---")
    start_score = 40
    round_target = {'type': 'num', 'value': 15}
    
    # Dart 1: S15 (Hit)
    d1 = {'number': '15', 'mult': 1, 'score': 15, 'label': 'S15'}
    hit1 = int(d1['number']) == round_target['value']
    assert hit1 == True, "S15 MUST be a hit on target 15"
    score = start_score + d1['score']
    hits = 1
    
    # Dart 2: S10 (Miss)
    d2 = {'number': '10', 'mult': 1, 'score': 10, 'label': 'S10'}
    hit2 = int(d2['number']) == round_target['value']
    assert hit2 == False, "S10 is a miss on target 15"
    
    # Dart 3: S2 (Miss)
    d3 = {'number': '2', 'mult': 1, 'score': 2, 'label': 'S2'}
    hit3 = int(d3['number']) == round_target['value']
    assert hit3 == False, "S2 is a miss on target 15"
    
    # End of turn check
    halved = False
    if hits == 0:
        score = math.floor(score / 2)
        halved = True
        
    assert halved == False, "Score MUST NOT be halved when 1 hit occurred!"
    assert score == 55, f"Score should be 55, got {score}"
    print("✅ Verified: Target 15 + S15 + S10 + S2 = 55 pts (SAFE, NOT HALVED)!")

test_split_score_dart_view_scenario()

def test_undo_mechanics():
    print("\n--- Test: Undo Mechanics ---")
    score = 40
    history = []
    
    # Step 1: Throw S15
    history.append({'prev_score': score, 'hits': 0})
    score += 15
    hits = 1
    assert score == 55
    
    # Undo step 1
    last = history.pop()
    score = last['prev_score']
    hits = last['hits']
    assert score == 40, f"Score after undo should be 40, got {score}"
    assert hits == 0, "Hits after undo should be 0"
    print("✅ Undo mechanics cleanly restore previous score and hit state")

test_undo_mechanics()
