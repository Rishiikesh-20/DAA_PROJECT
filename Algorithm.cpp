#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <queue>
#include <unordered_map>

using namespace std;

// Structure to represent the state of all lights
struct LightState {
    vector<int> colors; // 0=R, 1=G, 2=B
    
    // Custom hash function for the light state
    size_t hash() const {
        size_t h = 0;
        for (int color : colors) {
            h = h * 3 + color;
        }
        return h;
    }
    
    // Equality operator for light state
    bool operator==(const LightState& other) const {
        return colors == other.colors;
    }
};

// Custom hash function for unordered_map
struct LightStateHash {
    size_t operator()(const LightState& state) const {
        return state.hash();
    }
};

// Structure to represent a search state
struct State {
    LightState lights;
    vector<int> buttonPressCount;
    int totalPresses;
    
    State(const LightState& l, const vector<int>& bpc, int tp) 
        : lights(l), buttonPressCount(bpc), totalPresses(tp) {}
};

// Function to solve the Limited Button Presses problem to make all lights a specific color
pair<bool, vector<int>> solveAllLightsToColor(const string& lights, 
                                            const vector<vector<int>>& buttons, 
                                            const vector<int>& maxPresses,
                                            char targetColor) {
    int l = lights.size();
    int b = buttons.size();
    
    // Target color as integer (0=R, 1=G, 2=B)
    int targetColorVal;
    if (targetColor == 'R') targetColorVal = 0;
    else if (targetColor == 'G') targetColorVal = 1;
    else targetColorVal = 2; // 'B'
    
    // Convert lights to numbers: R=0, G=1, B=2
    LightState initialState;
    initialState.colors.resize(l);
    for (int i = 0; i < l; ++i) {
        if (lights[i] == 'R') {
            initialState.colors[i] = 0;
        } else if (lights[i] == 'G') {
            initialState.colors[i] = 1;
        } else { // 'B'
            initialState.colors[i] = 2;
        }
    }
    
    // BFS to find minimum button presses
    queue<State> q;
    unordered_map<LightState, vector<int>, LightStateHash> visited;
    
    vector<int> initialButtonPresses(b, 0);
    q.push(State(initialState, initialButtonPresses, 0));
    visited[initialState] = initialButtonPresses;
    
    while (!q.empty()) {
        State current = q.front();
        q.pop();
        
        // Check if all lights are the target color
        bool allTarget = true;
        for (int color : current.lights.colors) {
            if (color != targetColorVal) {
                allTarget = false;
                break;
            }
        }
        
        if (allTarget) {
            return {true, current.buttonPressCount};
        }
        
        // Try pressing each button once more
        for (int i = 0; i < b; ++i) {
            if (current.buttonPressCount[i] < maxPresses[i]) {
                // Create new state after pressing button i
                LightState newLights = current.lights;
                for (int lightIdx : buttons[i]) {
                    int idx = lightIdx - 1; // Convert to 0-indexed
                    // Button press cycles color: R->G->B->R (0->1->2->0)
                    newLights.colors[idx] = (newLights.colors[idx] + 1) % 3;
                }
                
                // Update button press counts
                vector<int> newButtonPresses = current.buttonPressCount;
                newButtonPresses[i]++;
                int newTotalPresses = current.totalPresses + 1;
                
                // If this light state hasn't been seen or was seen with more presses
                if (visited.find(newLights) == visited.end()) {
                    visited[newLights] = newButtonPresses;
                    q.push(State(newLights, newButtonPresses, newTotalPresses));
                }
            }
        }
    }
    
    // If we get here, it's impossible to turn all lights to the target color
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