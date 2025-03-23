#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// Arithmetic modulo 3 helpers
inline int mod3(int x) { return ((x % 3) + 3) % 3; }
inline int add_mod3(int a, int b) { return mod3(a + b); }
inline int sub_mod3(int a, int b) { return mod3(a - b); }
inline int mul_mod3(int a, int b) { return mod3(a * b); }
int inv_mod3(int a) {
    // Multiplicative inverse in Z_3 (a must be nonzero)
    if (a == 1) return 1;
    if (a == 2) return 2; // because 2 * 2 = 4 ≡ 1 mod 3
    return 0; // 0 has no inverse; we assume this will not be needed.
}

// Gaussian elimination over Z_3 on an augmented matrix A (size: numLights x (numButtons+1))
vector<vector<int>> gaussian_elimination(vector<vector<int>> A, int numLights, int numButtons) {
    int rank = 0;
    // Forward elimination: reduce A to row echelon form.
    for (int col = 0; col < numButtons && rank < numLights; ++col) {
        // Find pivot in column col.
        int pivot = -1;
        for (int i = rank; i < numLights; ++i) {
            if (A[i][col] != 0) {
                pivot = i;
                break;
            }
        }
        if (pivot == -1) continue; // no pivot here, move to next column.
        swap(A[pivot], A[rank]);
        int inv = inv_mod3(A[rank][col]);
        // Normalize pivot row and eliminate below.
        for (int i = rank + 1; i < numLights; ++i) {
            if (A[i][col] != 0) {
                int factor = mul_mod3(A[i][col], inv);
                for (int j = col; j <= numButtons; ++j)
                    A[i][j] = sub_mod3(A[i][j], mul_mod3(factor, A[rank][j]));
            }
        }
        ++rank;
    }
    // Back substitution: eliminate above the pivots.
    for (int row = rank - 1; row >= 0; --row) {
        int col = 0;
        while (col < numButtons && A[row][col] == 0) ++col;
        if (col == numButtons) continue;
        int inv = inv_mod3(A[row][col]);
        for (int i = 0; i < row; ++i) {
            if (A[i][col] != 0) {
                int factor = mul_mod3(A[i][col], inv);
                for (int j = col; j <= numButtons; ++j)
                    A[i][j] = sub_mod3(A[i][j], mul_mod3(factor, A[row][j]));
            }
        }
    }
    return A;
}

// Solve for button presses (each press is 0,1,or2 modulo 3) to turn all lights to targetColor,
// subject to maximum press constraints for each button.
pair<bool, vector<int>> solveAllLightsToColor(const string& lights,
                                              const vector<vector<int>>& buttons,
                                              const vector<int>& maxPresses,
                                              char targetColor) {
    int numLights = lights.size();
    int numButtons = buttons.size();
    int targetColorVal = (targetColor == 'R') ? 0 : (targetColor == 'G') ? 1 : 2;

    // Convert initial light colors into numbers (R=0, G=1, B=2).
    vector<int> vs(numLights);
    for (int i = 0; i < numLights; ++i) {
        char c = lights[i];
        if (c == 'R') vs[i] = 0;
        else if (c == 'G') vs[i] = 1;
        else if (c == 'B') vs[i] = 2;
        else {
            cerr << "Invalid light color detected at position " << i+1 << ".\n";
            return {false, {}};
        }
    }

    // Target state vector: every light must be targetColor.
    vector<int> ve(numLights, targetColorVal);
    // Compute the difference for each light (mod 3) between target and current state.
    vector<int> diff(numLights);
    for (int j = 0; j < numLights; ++j)
        diff[j] = sub_mod3(ve[j], vs[j]);

    // Build augmented matrix A: rows for lights, columns for buttons (last column is diff vector).
    vector<vector<int>> A(numLights, vector<int>(numButtons + 1, 0));
    for (int i = 0; i < numButtons; ++i) {
        for (int lightIdx : buttons[i]) {
            if (lightIdx < 1 || lightIdx > numLights) {
                cerr << "Button " << (i+1) << " controls an invalid light index " << lightIdx << ".\n";
                return {false, {}};
            }
            A[lightIdx - 1][i] = 1;  // Button press adds 1 mod 3.
        }
    }
    for (int j = 0; j < numLights; ++j)
        A[j][numButtons] = diff[j];

    // Perform Gaussian elimination to get the RREF.
    vector<vector<int>> rref = gaussian_elimination(A, numLights, numButtons);

    // Extract a particular solution x0 and record pivot columns.
    vector<int> x0(numButtons, 0);
    vector<int> pivot_cols;
    int rank = 0;
    for (int i = 0; i < numLights; ++i) {
        int col = 0;
        while (col < numButtons && rref[i][col] == 0) ++col;
        if (col == numButtons) {
            if (rref[i][numButtons] != 0) return {false, {}};
            continue;
        }
        pivot_cols.push_back(col);
        x0[col] = rref[i][numButtons];  // The required press (mod 3) for pivot button.
        rank++;
    }

    // Build a null-space basis for the free variables.
    vector<vector<int>> null_basis;
    for (int col = 0; col < numButtons; ++col) {
        if (find(pivot_cols.begin(), pivot_cols.end(), col) == pivot_cols.end()) {
            vector<int> basis_vec(numButtons, 0);
            basis_vec[col] = 1;
            for (int i = 0; i < rank; ++i) {
                int pcol = pivot_cols[i];
                basis_vec[pcol] = sub_mod3(0, rref[i][col]);
            }
            null_basis.push_back(basis_vec);
        }
    }

    int numFree = null_basis.size();
    vector<int> bestSolution;
    int bestTotal = -1;  // total button presses (we want to minimize)
    vector<int> freeAssign(numFree, 0);

    // Enumerate over all free variable assignments (each in {0,1,2}).
    bool done = false;
    while (!done) {
        vector<int> candidate(numButtons, 0);
        for (int i = 0; i < numButtons; ++i) {
            candidate[i] = x0[i];
            for (int k = 0; k < numFree; ++k)
                candidate[i] = add_mod3(candidate[i], mul_mod3(freeAssign[k], null_basis[k][i]));
        }
        // Check candidate against maximum press limits.
        // Note: even though mathematically button i needs candidate[i] (in {0,1,2}),
        // if maxPresses[i] < candidate[i], then this candidate is invalid.
        bool valid = true;
        int totalPresses = 0;
        for (int i = 0; i < numButtons; ++i) {
            int allowed = (maxPresses[i] < 2 ? maxPresses[i] : 2);
            if (candidate[i] > allowed) {
                valid = false;
                break;
            }
            totalPresses += candidate[i];
        }
        if (valid && (bestTotal == -1 || totalPresses < bestTotal)) {
            bestTotal = totalPresses;
            bestSolution = candidate;
        }
        // Increment freeAssign in base 3.
        int pos = 0;
        while (pos < numFree && freeAssign[pos] == 2) {
            freeAssign[pos] = 0;
            pos++;
        }
        if (pos == numFree)
            done = true;
        else
            freeAssign[pos]++;
    }

    if (bestTotal != -1)
        return {true, bestSolution};
    return {false, {}};
}

// Validate the candidate solution by simulating the button presses.
bool validateSolution(const string& lights, 
                      const vector<vector<int>>& buttons, 
                      const vector<int>& buttonPresses,
                      char targetColor) {
    int numLights = lights.size();
    int numButtons = buttons.size();
    int targetColorVal = (targetColor == 'R') ? 0 : (targetColor == 'G') ? 1 : 2;
    vector<int> current(numLights, 0);
    // Convert initial colors.
    for (int i = 0; i < numLights; ++i) {
        if (lights[i] == 'R') current[i] = 0;
        else if (lights[i] == 'G') current[i] = 1;
        else if (lights[i] == 'B') current[i] = 2;
    }
    // Simulate presses.
    for (int i = 0; i < numButtons; ++i) {
        for (int p = 0; p < buttonPresses[i]; ++p) {
            for (int lightIdx : buttons[i]) {
                int idx = lightIdx - 1;
                current[idx] = (current[idx] + 1) % 3;
            }
        }
    }
    // Check if all lights are targetColor.
    for (int c : current)
        if (c != targetColorVal)
            return false;
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int numLights, numButtons;
    cin >> numLights >> numButtons;
    
    string lights;
    cin >> lights;
    
    // Read maximum allowed presses for each button.
    // (This modification makes the limit available at the start.)
    vector<int> maxPresses(numButtons);
    for (int i = 0; i < numButtons; ++i)
        cin >> maxPresses[i];
    
    // Read button definitions.
    vector<vector<int>> buttons(numButtons);
    for (int i = 0; i < numButtons; ++i) {
        int k;
        cin >> k;
        buttons[i].resize(k);
        for (int j = 0; j < k; ++j)
            cin >> buttons[i][j];
    }
    
    char targetColor;
    cin >> targetColor;
    
    auto [possible, solution] = solveAllLightsToColor(lights, buttons, maxPresses, targetColor);
    
    if (!possible) {
        cout << "impossible\n";
        return 0;
    }
    
    int totalPresses = 0;
    for (int presses : solution)
        totalPresses += presses;
    
    cout << totalPresses << "\n";
    // Optionally, output the presses per button:
    for (int i = 0; i < (int)solution.size(); ++i)
        cout << "Button " << (i+1) << ": " << solution[i] << "\n";
    
    // Validation (optional demonstration)
    cout << "Solution validation: " << (validateSolution(lights, buttons, solution, targetColor) ? "Valid" : "Invalid") << "\n";
    
    return 0;
}
