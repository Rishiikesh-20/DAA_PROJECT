#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <queue>
#include <unordered_map>

using namespace std;

// Structure to represent the state of all lights (unchanged)
struct LightState {
    vector<int> colors; // 0=R, 1=G, 2=B
    size_t hash() const {
        size_t h = 0;
        for (int color : colors) {
            h = h * 3 + color;
        }
        return h;
    }
    bool operator==(const LightState& other) const {
        return colors == other.colors;
    }
};

struct LightStateHash {
    size_t operator()(const LightState& state) const {
        return state.hash();
    }
};

// Arithmetic modulo 3 helpers
inline int mod3(int x) { return ((x % 3) + 3) % 3; }
inline int add_mod3(int a, int b) { return mod3(a + b); }
inline int sub_mod3(int a, int b) { return mod3(a - b); }
inline int mul_mod3(int a, int b) { return mod3(a * b); }
int inv_mod3(int a) { // Multiplicative inverse in Z_3
    if (a == 1) return 1;
    if (a == 2) return 2; // 2 * 2 = 4 ≡ 1 mod 3
    return 0; // 0 has no inverse, but we won't need it
}

// Gaussian elimination over Z_3
vector<vector<int>> gaussian_elimination(vector<vector<int>> A, int l, int b) {
    vector<vector<int>> aug = A; // Copy A augmented with b (last column)
    int rank = 0;
    for (int col = 0; col < b && rank < l; ++col) {
        // Find pivot
        int pivot = -1;
        for (int i = rank; i < l; ++i) {
            if (aug[i][col] != 0) {
                pivot = i;
                break;
            }
        }
        if (pivot == -1) continue; // No pivot, move to next column

        // Swap rows
        if (pivot != rank) swap(aug[pivot], aug[rank]);

        // Eliminate below pivot
        int inv = inv_mod3(aug[rank][col]);
        for (int i = rank + 1; i < l; ++i) {
            if (aug[i][col] != 0) {
                int factor = mul_mod3(aug[i][col], inv);
                for (int j = col; j <= b; ++j) {
                    aug[i][j] = sub_mod3(aug[i][j], mul_mod3(factor, aug[rank][j]));
                }
            }
        }
        ++rank;
    }
    // Back substitution to get RREF
    for (int row = rank - 1; row >= 0; --row) {
        int col = 0;
        while (col < b && aug[row][col] == 0) ++col;
        if (col == b) continue; // Inconsistent if b[col] != 0
        int inv = inv_mod3(aug[row][col]);
        for (int i = 0; i < row; ++i) {
            if (aug[i][col] != 0) {
                int factor = mul_mod3(aug[i][col], inv);
                for (int j = col; j <= b; ++j) {
                    aug[i][j] = sub_mod3(aug[i][j], mul_mod3(factor, aug[row][j]));
                }
            }
        }
    }
    return aug;
}

// Solve A * x = b over Z_3 with constraints
pair<bool, vector<int>> solveAllLightsToColor(const string& lights,
                                             const vector<vector<int>>& buttons,
                                             const vector<int>& maxPresses,
                                             char targetColor) {
    int l = lights.size();
    int b = buttons.size();

    // Target color value
    int targetColorVal = (targetColor == 'R') ? 0 : (targetColor == 'G') ? 1 : 2;

    // Initial state
    vector<int> vs(l);
    for (int i = 0; i < l; ++i) {
        vs[i] = (lights[i] == 'R') ? 0 : (lights[i] == 'G') ? 1 : 2;
    }

    // Target state
    vector<int> ve(l, targetColorVal);

    // Compute b = ve - vs mod 3
    vector<int> b(l);
    for (int j = 0; j < l; ++j) {
        b[j] = sub_mod3(ve[j], vs[j]);
    }

    // Build matrix A (l x b), augmented with b
    vector<vector<int>> A(l, vector<int>(b + 1, 0));
    for (int i = 0; i < b; ++i) {
        for (int lightIdx : buttons[i]) {
            int j = lightIdx - 1; // 0-based index
            A[j][i] = 1;
        }
    }
    for (int j = 0; j < l; ++j) {
        A[j][b] = b[j];
    }

    // Perform Gaussian elimination
    vector<vector<int>> rref = gaussian_elimination(A, l, b);

    // Check consistency and extract particular solution
    vector<int> x0(b, 0);
    vector<int> pivot_cols(l, -1);
    int rank = 0;
    for (int i = 0; i < l; ++i) {
        int col = 0;
        while (col < b && rref[i][col] == 0) ++col;
        if (col == b) {
            if (rref[i][b] != 0) return {false, vector<int>()}; // Inconsistent
            break;
        }
        pivot_cols[i] = col;
        x0[col] = rref[i][b];
        ++rank;
    }

    // Find null space basis
    vector<vector<int>> null_basis;
    for (int col = 0; col < b; ++col) {
        bool is_free = true;
        for (int i = 0; i < rank; ++i) {
            if (pivot_cols[i] == col) {
                is_free = false;
                break;
            }
        }
        if (is_free) {
            vector<int> basis_vec(b, 0);
            basis_vec[col] = 1;
            for (int i = 0; i < rank; ++i) {
                int pcol = pivot_cols[i];
                basis_vec[pcol] = sub_mod3(0, rref[i][col]);
            }
            null_basis.push_back(basis_vec);
        }
    }

    // Enumerate solutions: x = x0 + sum(y_k * n_k)
    int k = null_basis.size();
    vector<int> best_x;
    int min_presses = -1;
    vector<int> y(k, 0);
    while (true) {
        vector<int> x(b);
        for (int i = 0; i < b; ++i) {
            x[i] = x0[i];
            for (int j = 0; j < k; ++j) {
                x[i] = add_mod3(x[i], mul_mod3(y[j], null_basis[j][i]));
            }
        }
        // Check constraints
        bool valid = true;
        int total = 0;
        for (int i = 0; i < b; ++i) {
            if (x[i] > min(maxPresses[i], 2)) {
                valid = false;
                break;
            }
            total += x[i];
        }
        if (valid && (min_presses == -1 || total < min_presses)) {
            min_presses = total;
            best_x = x;
        }
        // Next combination
        int pos = 0;
        while (pos < k && y[pos] == 2) y[pos++] = 0;
        if (pos == k) break;
        y[pos]++;
    }

    if (min_presses != -1) {
        return {true, best_x};
    }
    return {false, vector<int>()};
}
// Function to check if a solution is valid
bool validateSolution(const string& lights, 
                     const vector<vector<int>>& buttons, 
                     const vector<int>& buttonPresses,
                     char targetColor) {
    int l = lights.size();
    int b = buttons.size();
    
    // Target color as integer (0=R, 1=G, 2=B)
    int targetColorVal;
    if (targetColor == 'R') targetColorVal = 0;
    else if (targetColor == 'G') targetColorVal = 1;
    else targetColorVal = 2; // 'B'
    
    // Convert lights to numbers: R=0, G=1, B=2
    vector<int> lightColors(l);
    for (int i = 0; i < l; ++i) {
        if (lights[i] == 'R') {
            lightColors[i] = 0;
        } else if (lights[i] == 'G') {
            lightColors[i] = 1;
        } else { // 'B'
            lightColors[i] = 2;
        }
    }
    
    // Apply button presses
    for (int i = 0; i < b; ++i) {
        for (int press = 0; press < buttonPresses[i]; ++press) {
            for (int lightIdx : buttons[i]) {
                int idx = lightIdx - 1; // Convert to 0-indexed
                lightColors[idx] = (lightColors[idx] + 1) % 3;
            }
        }
    }
    
    // Check if all lights are the target color
    for (int color : lightColors) {
        if (color != targetColorVal) {
            return false;
        }
    }
    
    return true;
}

int main() {
    // Get user input
    int l, b;
    string lights;
    char targetColor;
    
    cout << "Enter number of lights: ";
    cin >> l;
    cout << "Enter number of buttons: ";
    cin >> b;
    
    cout << "Enter initial light colors (R/G/B string): ";
    cin >> lights;
    
    cout << "Enter target color (R/G/B): ";
    cin >> targetColor;
    
    vector<vector<int>> buttons(b);
    vector<int> maxPresses(b);
    
    for (int i = 0; i < b; ++i) {
        int k;
        cout << "Enter number of lights controlled by button " << (i+1) << ": ";
        cin >> k;
        
        cout << "Enter " << k << " light indices controlled by button " << (i+1) << ": ";
        for (int j = 0; j < k; ++j) {
            int lightIdx;
            cin >> lightIdx;
            buttons[i].push_back(lightIdx);
        }
        
        cout << "Enter maximum presses for button " << (i+1) << ": ";
        cin >> maxPresses[i];
    }
    
    // Solve the problem
    auto [possible, buttonPresses] = solveAllLightsToColor(lights, buttons, maxPresses, targetColor);
    
    if (possible) {
        cout << "Solution found! Button presses: " << endl;
        int totalPresses = 0;
        for (int i = 0; i < b; ++i) {
            cout << "Button " << (i+1) << ": " << buttonPresses[i] << " times" << endl;
            totalPresses += buttonPresses[i];
        }
        cout << "Total button presses: " << totalPresses << endl;
        
        // Validate solution
        bool valid = validateSolution(lights, buttons, buttonPresses, targetColor);
        cout << "Solution validation: " << (valid ? "Valid" : "Invalid") << endl;
    } else {
        cout << "Impossible to turn all lights to " << targetColor << endl;
    }
    
    return 0;
}