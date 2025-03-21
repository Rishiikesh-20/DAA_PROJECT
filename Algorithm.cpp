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
    // Multiplicative inverse in Z_3
    if (a == 1) return 1;
    if (a == 2) return 2; // since 2 * 2 = 4 ≡ 1 mod 3
    return 0; // 0 has no inverse; we assume no pivot will be 0 when needed.
}

// Gaussian elimination over Z_3 on an augmented matrix A (size: numLights x (numButtons+1))
vector<vector<int>> gaussian_elimination(vector<vector<int>> A, int numLights, int numButtons) {
    int rank = 0;
    // Forward elimination
    for (int col = 0; col < numButtons && rank < numLights; ++col) {
        // Find pivot in column col
        int pivot = -1;
        for (int i = rank; i < numLights; ++i) {
            if (A[i][col] != 0) {
                pivot = i;
                break;
            }
        }
        if (pivot == -1) continue; // No pivot in this column, move to next

        // Swap current row with pivot row if needed
        if (pivot != rank)
            swap(A[pivot], A[rank]);

        // Normalize pivot row and eliminate below pivot
        int inv = inv_mod3(A[rank][col]);
        for (int i = rank + 1; i < numLights; ++i) {
            if (A[i][col] != 0) {
                int factor = mul_mod3(A[i][col], inv);
                for (int j = col; j <= numButtons; ++j) {
                    A[i][j] = sub_mod3(A[i][j], mul_mod3(factor, A[rank][j]));
                }
            }
        }
        ++rank;
    }
    // Back substitution to obtain RREF
    for (int row = rank - 1; row >= 0; --row) {
        int col = 0;
        while (col < numButtons && A[row][col] == 0) ++col;
        if (col == numButtons) continue;
        int inv = inv_mod3(A[row][col]);
        for (int i = 0; i < row; ++i) {
            if (A[i][col] != 0) {
                int factor = mul_mod3(A[i][col], inv);
                for (int j = col; j <= numButtons; ++j) {
                    A[i][j] = sub_mod3(A[i][j], mul_mod3(factor, A[row][j]));
                }
            }
        }
    }
    return A;
}

// Solve for button presses to turn all lights to targetColor.
// Returns a pair: {true, vector of presses} if a solution exists; otherwise {false, {}}.
pair<bool, vector<int>> solveAllLightsToColor(const string& lights,
                                              const vector<vector<int>>& buttons,
                                              const vector<int>& maxPresses,
                                              char targetColor) {
    int numLights = lights.size();
    int numButtons = buttons.size();
    int targetColorVal = (targetColor == 'R') ? 0 : (targetColor == 'G') ? 1 : 2;

    // Convert initial light colors into numeric values (R=0, G=1, B=2)
    vector<int> vs(numLights);
    for (int i = 0; i < numLights; ++i) {
        char c = lights[i];
        if (c == 'R') vs[i] = 0;
        else if (c == 'G') vs[i] = 1;
        else if (c == 'B') vs[i] = 2;
        else {
            cerr << "Invalid light color detected at position " << i+1 << ". Only R, G, or B allowed.\n";
            return {false, {}};
        }
    }

    // Target state: every light should have targetColorVal
    vector<int> ve(numLights, targetColorVal);

    // diff[j] = (target - initial) mod 3 for each light j.
    vector<int> diff(numLights);
    for (int j = 0; j < numLights; ++j) {
        diff[j] = sub_mod3(ve[j], vs[j]);
    }

    // Build augmented matrix A with dimensions: numLights x (numButtons + 1)
    // Each column (except the last) corresponds to a button. A[j][i] = 1 if button i controls light j.
    vector<vector<int>> A(numLights, vector<int>(numButtons + 1, 0));
    for (int i = 0; i < numButtons; ++i) {
        // Validate button indices
        for (int lightIdx : buttons[i]) {
            if (lightIdx < 1 || lightIdx > numLights) {
                cerr << "Button " << (i+1) << " controls an invalid light index " << lightIdx << ".\n";
                return {false, {}};
            }
            int j = lightIdx - 1; // convert to 0-indexed
            A[j][i] = 1;
        }
    }
    // Last column is the diff vector.
    for (int j = 0; j < numLights; ++j) {
        A[j][numButtons] = diff[j];
    }

    // Perform Gaussian elimination to get RREF.
    vector<vector<int>> rref = gaussian_elimination(A, numLights, numButtons);

    // Extract a particular solution, and record pivot columns.
    vector<int> x0(numButtons, 0);
    vector<int> pivot_cols; // which column is pivot in each row
    int rank = 0;
    for (int i = 0; i < numLights; ++i) {
        int col = 0;
        while (col < numButtons && rref[i][col] == 0) ++col;
        if (col == numButtons) {
            // If no pivot then the row should have 0 in augmented part.
            if (rref[i][numButtons] != 0)
                return {false, {}}; // inconsistent system
            continue;
        }
        pivot_cols.push_back(col);
        x0[col] = rref[i][numButtons];
        rank++;
    }
    
    // Determine free variables and build the null space basis.
    vector<vector<int>> null_basis;
    for (int col = 0; col < numButtons; ++col) {
        // If col is not a pivot column, it's a free variable.
        if (find(pivot_cols.begin(), pivot_cols.end(), col) == pivot_cols.end()) {
            vector<int> basis_vec(numButtons, 0);
            basis_vec[col] = 1;
            // For each pivot row, express pivot variable in terms of free variable.
            for (int i = 0; i < rank; ++i) {
                int pcol = pivot_cols[i];
                basis_vec[pcol] = sub_mod3(0, rref[i][col]);
            }
            null_basis.push_back(basis_vec);
        }
    }

    // Enumerate solutions: x = x0 + sum(y_k * n_k) for free variable choices y_k in {0, 1, 2}.
    // We search for a solution that satisfies the constraint: x[i] <= min(maxPresses[i], 2)
    int numFree = null_basis.size();
    vector<int> best_x;
    int min_total = -1;
    vector<int> y(numFree, 0);
    bool done = false;
    while (!done) {
        vector<int> candidate(numButtons, 0);
        for (int i = 0; i < numButtons; ++i) {
            candidate[i] = x0[i];
            for (int k = 0; k < numFree; ++k) {
                candidate[i] = add_mod3(candidate[i], mul_mod3(y[k], null_basis[k][i]));
            }
        }
        // Check constraints for this candidate solution.
        bool valid = true;
        int total = 0;
        for (int i = 0; i < numButtons; ++i) {
            // Only values 0,1,2 are allowed; also candidate[i] must not exceed maxPresses.
            if (candidate[i] > min(maxPresses[i], 2)) {
                valid = false;
                break;
            }
            total += candidate[i];
        }
        if (valid && (min_total == -1 || total < min_total)) {
            min_total = total;
            best_x = candidate;
        }
        // Increment the free variable combination in base 3.
        int pos = 0;
        while (pos < numFree && y[pos] == 2) {
            y[pos] = 0;
            pos++;
        }
        if (pos == numFree)
            done = true;
        else
            y[pos]++;
    }
    
    if (min_total != -1)
        return {true, best_x};
    return {false, {}};
}

// Validate the solution by simulating the button presses.
bool validateSolution(const string& lights, 
                      const vector<vector<int>>& buttons, 
                      const vector<int>& buttonPresses,
                      char targetColor) {
    int numLights = lights.size();
    int numButtons = buttons.size();
    
    int targetColorVal = (targetColor == 'R') ? 0 : (targetColor == 'G') ? 1 : 2;
    vector<int> lightColors(numLights, 0);
    
    // Convert initial lights into numeric values.
    for (int i = 0; i < numLights; ++i) {
        if (lights[i] == 'R') lightColors[i] = 0;
        else if (lights[i] == 'G') lightColors[i] = 1;
        else if (lights[i] == 'B') lightColors[i] = 2;
    }
    
    // Simulate button presses.
    for (int i = 0; i < numButtons; ++i) {
        for (int p = 0; p < buttonPresses[i]; ++p) {
            for (int lightIdx : buttons[i]) {
                int idx = lightIdx - 1;
                lightColors[idx] = (lightColors[idx] + 1) % 3;
            }
        }
    }
    
    // Check that all lights are the target color.
    for (int color : lightColors) {
        if (color != targetColorVal)
            return false;
    }
    return true;
}

int main() {
    int numLights, numButtons;
    string lights;
    char targetColor;
    
    cout << "Enter number of lights: ";
    cin >> numLights;
    
    cout << "Enter number of buttons: ";
    cin >> numButtons;
    
    cout << "Enter initial light colors (R/G/B string): ";
    cin >> lights;
    if (lights.size() != (unsigned)numLights) {
        cerr << "Error: The length of the light string must equal the number of lights.\n";
        return 1;
    }
    
    cout << "Enter target color (R/G/B): ";
    cin >> targetColor;
    if (targetColor != 'R' && targetColor != 'G' && targetColor != 'B') {
        cerr << "Error: Target color must be R, G, or B.\n";
        return 1;
    }
    
    vector<vector<int>> buttons(numButtons);
    vector<int> maxPresses(numButtons);
    
    for (int i = 0; i < numButtons; ++i) {
        int k;
        cout << "Enter number of lights controlled by button " << (i+1) << ": ";
        cin >> k;
        if (k <= 0) {
            cerr << "Error: Button " << (i+1) << " must control at least one light.\n";
            return 1;
        }
        cout << "Enter " << k << " light indices controlled by button " << (i+1) << ": ";
        for (int j = 0; j < k; ++j) {
            int lightIdx;
            cin >> lightIdx;
            // Validate the light index.
            if (lightIdx < 1 || lightIdx > numLights) {
                cerr << "Error: Light index " << lightIdx << " is out of bounds.\n";
                return 1;
            }
            buttons[i].push_back(lightIdx);
        }
        
        cout << "Enter maximum presses for button " << (i+1) << ": ";
        cin >> maxPresses[i];
        if (maxPresses[i] < 0) {
            cerr << "Error: Maximum presses cannot be negative.\n";
            return 1;
        }
    }
    
    auto [possible, buttonPresses] = solveAllLightsToColor(lights, buttons, maxPresses, targetColor);
    
    if (possible) {
        cout << "\nSolution found! Button presses:\n";
        int totalPresses = 0;
        for (int i = 0; i < numButtons; ++i) {
            cout << "Button " << (i+1) << ": " << buttonPresses[i] << " times\n";
            totalPresses += buttonPresses[i];
        }
        cout << "Total button presses: " << totalPresses << "\n";
        
        // Validate the solution.
        bool valid = validateSolution(lights, buttons, buttonPresses, targetColor);
        cout << "Solution validation: " << (valid ? "Valid" : "Invalid") << "\n";
    } else {
        cout << "\nImpossible to turn all lights to " << targetColor << "\n";
    }
    
    return 0;
}
