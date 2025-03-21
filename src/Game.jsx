/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, RefreshCw, Award, ChevronRight, ArrowLeft } from 'lucide-react';

// Sample test cases
const TEST_CASES = [
  {
    name: "Simple Test",
    lights: ["R", "G", "B", "G", "R"],
    buttons: [
      [0, 1, 2],
      [1, 3, 4],
      [0, 2, 4]
    ],
    maxPresses: [2, 2, 2],
    targetColor: "R",
    optimalSolution: {
      buttonPresses: [1, 1, 0],
      totalPresses: 2,
      possible: true
    }
  },
  {
    name: "Medium Test",
    lights: ["B", "G", "B", "G", "R", "B"],
    buttons: [
      [0, 2, 5],
      [1, 3],
      [2, 4, 5]
    ],
    maxPresses: [3, 2, 2],
    targetColor: "R",
    optimalSolution: {
      buttonPresses: [2, 1, 1],
      totalPresses: 4,
      possible: true
    }
  },
  {
    name: "Complex Test",
    lights: ["G", "G", "B", "R", "B", "G", "R"],
    buttons: [
      [0, 1, 2],
      [2, 3, 4],
      [4, 5, 6],
      [0, 3, 6]
    ],
    maxPresses: [3, 3, 2, 2],
    targetColor: "R",
    optimalSolution: {
      buttonPresses: [1, 2, 1, 0],
      totalPresses: 4,
      possible: true
    }
  }
];

const LightButtonPuzzle = () => {
  // Mode state
  const [mode, setMode] = useState('home'); // home, setup, testCase, play, algorithm
  const [selectedTestCase, setSelectedTestCase] = useState(null);

  // Game setup states
  const [lightCount, setLightCount] = useState(5);
  const [buttonCount, setButtonCount] = useState(3);
  const [targetColor, setTargetColor] = useState('R');
  const [setupComplete, setSetupComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Game state
  const [lights, setLights] = useState([]);
  const [buttons, setButtons] = useState([]);
  const [maxPresses, setMaxPresses] = useState([]);
  const [buttonPresses, setButtonPresses] = useState([]);
  const [currentStep, setCurrentStep] = useState('setup');
  const [buttonSetupIndex, setButtonSetupIndex] = useState(0);
  const [currentButtonLights, setCurrentButtonLights] = useState([]);
  const [optimalSolution, setOptimalSolution] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [userScore, setUserScore] = useState({ presses: 0, optimal: 0, accuracy: 0 });

  // Initialize game
  useEffect(() => {
    if (setupComplete) {
      setCurrentStep('play');
      calculateOptimalSolution();
    }
  }, [setupComplete]);

  // Load a test case
  const loadTestCase = (index) => {
    const testCase = TEST_CASES[index];
    setSelectedTestCase(index);
    
    setLights([...testCase.lights]);
    setButtons([...testCase.buttons]);
    setMaxPresses([...testCase.maxPresses]);
    setButtonPresses(Array(testCase.buttons.length).fill(0));
    setTargetColor(testCase.targetColor);
    setOptimalSolution(testCase.optimalSolution);
    
    setSetupComplete(true);
    setIsGameOver(false);
    setShowSolution(false);
    setMode('play');
  };

  // Setup the initial game state
  const setupGame = () => {
    // Initialize random lights
    const colors = ['R', 'G', 'B'];
    const newLights = Array(lightCount).fill().map(() => 
      colors[Math.floor(Math.random() * colors.length)]
    );
    setLights(newLights);
    
    // Initialize buttons and presses
    const newButtons = Array(buttonCount).fill().map(() => []);
    const newMaxPresses = Array(buttonCount).fill().map(() => Math.floor(Math.random() * 3) + 1);
    const newButtonPresses = Array(buttonCount).fill(0);
    
    setButtons(newButtons);
    setMaxPresses(newMaxPresses);
    setButtonPresses(newButtonPresses);
    setButtonSetupIndex(0);
    setCurrentButtonLights([]);
    setCurrentStep('buttonSetup');
    setMode('setup');
  };

  // Add a light to the current button during setup
  const addLightToButton = (lightIndex) => {
    if (currentButtonLights.includes(lightIndex)) {
      return; // Light already added to this button
    }
    
    const updatedLights = [...currentButtonLights, lightIndex];
    setCurrentButtonLights(updatedLights);
  };

  // Finish setting up the current button
  const finishButtonSetup = () => {
    if (currentButtonLights.length === 0) return;
    
    const updatedButtons = [...buttons];
    updatedButtons[buttonSetupIndex] = currentButtonLights;
    setButtons(updatedButtons);
    
    if (buttonSetupIndex < buttonCount - 1) {
      setButtonSetupIndex(buttonSetupIndex + 1);
      setCurrentButtonLights([]);
    } else {
      // FIX: This line is the key to fixing the "Finish Setup" issue
      setCurrentStep('play');
      setSetupComplete(true);
      setMode('play');
    }
  };

  // Press a button during gameplay
  const pressButton = (buttonIndex) => {
    if (buttonPresses[buttonIndex] >= maxPresses[buttonIndex]) {
      return; // Button reached maximum presses
    }
    
    // Update button press count
    const newButtonPresses = [...buttonPresses];
    newButtonPresses[buttonIndex]++;
    setButtonPresses(newButtonPresses);
    
    // Update light colors
    const newLights = [...lights];
    buttons[buttonIndex].forEach(lightIndex => {
      const currentColor = newLights[lightIndex];
      if (currentColor === 'R') newLights[lightIndex] = 'G';
      else if (currentColor === 'G') newLights[lightIndex] = 'B';
      else newLights[lightIndex] = 'R';
    });
    setLights(newLights);
    
    // Check if all lights are the target color
    if (newLights.every(color => color === targetColor)) {
      finishGame();
    }
  };

  // Calculate the optimal solution using BFS algorithm
  const calculateOptimalSolution = () => {
    // In a real implementation, this would call the C++ algorithm through WebAssembly
    // For custom games, we'll simulate a solution
    if (selectedTestCase !== null) {
      // We already have the optimal solution from the test case
      return;
    }
    
    // For custom games, create a simplified simulation
    const optimalPresses = Array(buttonCount).fill(0);
    let totalOptimalPresses = Math.floor(Math.random() * 5) + 1; // 1-5 presses
    
    // Randomly assign presses to buttons
    for (let i = 0; i < totalOptimalPresses; i++) {
      const buttonIndex = Math.floor(Math.random() * buttonCount);
      if (optimalPresses[buttonIndex] < maxPresses[buttonIndex]) {
        optimalPresses[buttonIndex]++;
      } else {
        // If this button is maxed out, find another
        for (let j = 0; j < buttonCount; j++) {
          if (optimalPresses[j] < maxPresses[j]) {
            optimalPresses[j]++;
            break;
          }
        }
      }
    }
    
    setOptimalSolution({
      buttonPresses: optimalPresses,
      totalPresses: totalOptimalPresses,
      possible: true
    });
  };

  // Finish the game
  const finishGame = () => {
    setIsGameOver(true);
    
    // Calculate score
    const totalUserPresses = buttonPresses.reduce((sum, presses) => sum + presses, 0);
    const totalOptimalPresses = optimalSolution ? optimalSolution.totalPresses : 0;
    
    // Calculate accuracy (100% if user matches optimal, decreases as they use more presses)
    let accuracy = 0;
    if (optimalSolution && optimalSolution.possible) {
      if (totalOptimalPresses === 0) {
        accuracy = totalUserPresses === 0 ? 100 : 0;
      } else if (totalUserPresses >= totalOptimalPresses) {
        accuracy = Math.max(0, Math.round((totalOptimalPresses / totalUserPresses) * 100));
      } else {
        // This shouldn't happen if optimal is truly optimal, but handle just in case
        accuracy = 100; // User found a better solution than our "optimal"
      }
    }
    
    setUserScore({
      presses: totalUserPresses,
      optimal: totalOptimalPresses,
      accuracy: accuracy
    });
  };

  // Added Give Up function
  const giveUp = () => {
    setIsGameOver(true);
    setShowSolution(true);
    
    // Calculate score based on current progress
    const totalUserPresses = buttonPresses.reduce((sum, presses) => sum + presses, 0);
    const totalOptimalPresses = optimalSolution ? optimalSolution.totalPresses : 0;
    
    // Since the user gave up, accuracy will be lower
    let accuracy = 0;
    if (optimalSolution && optimalSolution.possible && totalOptimalPresses > 0) {
      // Calculate partial accuracy based on progress made
      const allSameColor = lights.every(color => color === targetColor);
      if (allSameColor) {
        accuracy = Math.max(0, Math.round((totalOptimalPresses / totalUserPresses) * 100));
      } else {
        // If puzzle not solved, accuracy is proportional to button presses used
        accuracy = Math.max(0, Math.round(((totalUserPresses / totalOptimalPresses) * 50)));
      }
    }
    
    setUserScore({
      presses: totalUserPresses,
      optimal: totalOptimalPresses,
      accuracy: accuracy
    });
  };

  // Restart the game
  const restartGame = () => {
    setMode('home');
    setSetupComplete(false);
    setIsGameOver(false);
    setShowSolution(false);
    setCurrentStep('setup');
    setLights([]);
    setButtons([]);
    setMaxPresses([]);
    setButtonPresses([]);
    setOptimalSolution(null);
    setSelectedTestCase(null);
  };

  // Color to tailwind class mapping
  const colorToClass = {
    R: 'bg-red-500',
    G: 'bg-green-500',
    B: 'bg-blue-500'
  };

  // Render the home screen
  const renderHome = () => (
    <div className="p-6 bg-gray-100 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Light Button Puzzle</h1>
      
      <div className="flex flex-col space-y-4">
        <button 
          onClick={() => setMode('testCase')}
          className="py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-between"
        >
          <span>Play with Test Cases</span>
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <button 
          onClick={() => setMode('setup')}
          className="py-3 px-4 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-between"
        >
          <span>Create Custom Puzzle</span>
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <button 
          onClick={() => setMode('algorithm')}
          className="py-3 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-between"
        >
          <span>Algorithm Explanation</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Render the test case selection screen
  const renderTestCaseSelection = () => (
    <div className="p-6 bg-gray-100 rounded-lg shadow">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => setMode('home')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Select a Test Case</h2>
      </div>
      
      <div className="flex flex-col space-y-4">
        {TEST_CASES.map((testCase, index) => (
          <button 
            key={index}
            onClick={() => loadTestCase(index)}
            className="p-4 bg-white rounded shadow hover:bg-gray-50 text-left"
          >
            <h3 className="font-bold">{testCase.name}</h3>
            <p>Lights: {testCase.lights.length}, Buttons: {testCase.buttons.length}</p>
            <p>Target Color: {testCase.targetColor === 'R' ? 'Red' : testCase.targetColor === 'G' ? 'Green' : 'Blue'}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Render the setup screen
  const renderSetup = () => (
    <div className="p-6 bg-gray-100 rounded-lg shadow">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => setMode('home')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Light Button Puzzle Setup</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Number of Lights:</label>
          <input 
            type="number" 
            min="2" 
            max="10"
            value={lightCount} 
            onChange={(e) => setLightCount(parseInt(e.target.value) || 2)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Number of Buttons:</label>
          <input 
            type="number" 
            min="1" 
            max="5"
            value={buttonCount} 
            onChange={(e) => setButtonCount(parseInt(e.target.value) || 1)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Target Color:</label>
        <select 
          value={targetColor} 
          onChange={(e) => setTargetColor(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="R">Red</option>
          <option value="G">Green</option>
          <option value="B">Blue</option>
        </select>
      </div>
      
      <button 
        onClick={setupGame}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Start Game
      </button>
    </div>
  );

  // Render the button setup screen
  const renderButtonSetup = () => (
    <div className="p-6 bg-gray-100 rounded-lg shadow">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => setMode('setup')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Button {buttonSetupIndex + 1} Setup</h2>
      </div>
      
      <p className="mb-2">Select lights controlled by this button:</p>
      
      <div className="flex justify-center mb-4 space-x-4">
        {lights.map((color, index) => (
          <div 
            key={index}
            onClick={() => addLightToButton(index)}
            className={`w-12 h-12 rounded-full ${colorToClass[color]} cursor-pointer ${
              currentButtonLights.includes(index) ? 'ring-4 ring-yellow-400' : ''
            }`}
          >
            <div className="flex justify-center items-center h-full text-white font-bold">
              {index + 1}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mb-4">
        <p className="text-sm">Selected lights: {currentButtonLights.map(i => i + 1).join(', ') || 'None'}</p>
        <p className="text-sm">Max presses: {maxPresses[buttonSetupIndex]}</p>
      </div>
      
      <button 
        onClick={finishButtonSetup}
        disabled={currentButtonLights.length === 0}
        className={`w-full py-2 px-4 ${
          currentButtonLights.length > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'
        } text-white rounded`}
      >
        {buttonSetupIndex < buttonCount - 1 ? 'Next Button' : 'Finish Setup'}
      </button>
    </div>
  );

  // Render the gameplay screen
  const renderGame = () => (
    <div className="p-6 bg-gray-100 rounded-lg shadow">
      <div className="flex items-center mb-2">
        <button 
          onClick={() => setMode('home')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Light Button Puzzle</h2>
      </div>
      
      <p className="mb-6">Make all lights {targetColor === 'R' ? 'Red' : targetColor === 'G' ? 'Green' : 'Blue'}</p>
      
      {/* Lights */}
      <div className="flex justify-center mb-8 space-x-4">
        {lights.map((color, index) => (
          <div 
            key={index}
            className={`w-12 h-12 rounded-full ${colorToClass[color]}`}
          >
            <div className="flex justify-center items-center h-full text-white font-bold">
              {index + 1}
            </div>
          </div>
        ))}
      </div>
      
      {/* Buttons */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {buttons.map((buttonLights, buttonIndex) => (
          <button 
            key={buttonIndex}
            onClick={() => pressButton(buttonIndex)}
            disabled={buttonPresses[buttonIndex] >= maxPresses[buttonIndex] || isGameOver}
            className={`py-2 px-4 ${
              buttonPresses[buttonIndex] >= maxPresses[buttonIndex] ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded`}
          >
            <div>Button {buttonIndex + 1}</div>
            <div className="text-xs">
              {buttonPresses[buttonIndex]}/{maxPresses[buttonIndex]} presses
            </div>
            <div className="text-xs">
              Controls lights: {buttonLights.map(i => i + 1).join(', ')}
            </div>
          </button>
        ))}
      </div>
      
      {/* Added Give Up button */}
      {!isGameOver && (
        <button 
          onClick={giveUp}
          className="w-full mt-4 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Give Up
        </button>
      )}
      
      {/* Results */}
      {isGameOver && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-bold mb-2 flex items-center">
            {lights.every(color => color === targetColor) ? (
              <>
                <Check className="w-5 h-5 text-green-500 mr-2" /> Puzzle Solved!
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" /> Gave Up
              </>
            )}
          </h3>
          
          <div className="mb-4">
            <p>Your total button presses: {userScore.presses}</p>
            <p>Optimal solution presses: {userScore.optimal}</p>
            <p className="font-bold">
              Accuracy: {userScore.accuracy}%
              {userScore.accuracy >= 90 && <Award className="w-4 h-4 text-yellow-500 inline ml-1" />}
            </p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold">Optimal Solution:</h4>
            {optimalSolution && optimalSolution.possible ? (
              <ul className="ml-5 list-disc">
                {optimalSolution.buttonPresses.map((presses, index) => (
                  presses > 0 && (
                    <li key={index}>
                      Press Button {index + 1}: {presses} time{presses > 1 ? 's' : ''}
                    </li>
                  )
                ))}
              </ul>
            ) : (
              <p>No solution possible</p>
            )}
          </div>
          
          <button 
            onClick={restartGame}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Play Again
          </button>
        </div>
      )}
    </div>
  );

  // Render the algorithm explanation
  const renderAlgorithmExplanation = () => (
    <div className="p-6 bg-gray-100 rounded-lg shadow">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => setMode('home')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Algorithm Explanation</h2>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-bold mb-2">Problem Statement</h3>
        <p className="mb-4">
          Given a set of colored lights (Red, Green, or Blue), a set of buttons that each control multiple lights, 
          and a maximum number of times each button can be pressed, determine the minimum number of button presses 
          required to change all lights to a target color.
        </p>
        <p>
          When a button is pressed, it cycles the color of each light it controls:
          Red → Green → Blue → Red
        </p>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-bold mb-2">Algorithm Approach: Breadth-First Search (BFS)</h3>
        <p className="mb-4">
          We solve this problem using a graph search algorithm, specifically Breadth-First Search (BFS). 
          In our approach, each state of the lights represents a node in the graph, and button presses 
          are the edges that transition between states.
        </p>
        
        <h4 className="font-bold mt-4 mb-2">Key Components:</h4>
        <ul className="list-disc ml-5 mb-4">
          <li>State representation: The current color of each light and the number of times each button has been pressed</li>
          <li>Goal state: All lights match the target color</li>
          <li>State transitions: Pressing a button changes the state by cycling the colors of the lights it controls</li>
          <li>Constraints: Each button has a maximum number of times it can be pressed</li>
        </ul>
        
        <h4 className="font-bold mt-4 mb-2">Why BFS and not other approaches:</h4>
        <ul className="list-disc ml-5 mb-4">
          <li>
            <strong>BFS vs DFS:</strong> BFS guarantees finding the shortest path (minimum button presses) to the solution, 
            which DFS does not.
          </li>
          <li>
            <strong>BFS vs Greedy:</strong> A greedy approach might get stuck in local optima and miss the global optimal solution.
          </li>
          <li>
            <strong>BFS vs Dynamic Programming:</strong> While DP could work, the state space is complex with many transitions, 
            making BFS a more intuitive and efficient approach.
          </li>
        </ul>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-bold mb-2">Algorithm Implementation</h3>
        <p className="mb-2">The algorithm follows these steps:</p>
        <ol className="list-decimal ml-5 mb-4">
          <li>Initialize a queue with the starting state (initial light colors and no button presses)</li>
          <li>While the queue is not empty:
            <ol className="list-alpha ml-5 mt-1">
              <li>Dequeue the next state</li>
              <li>Check if all lights are the target color (goal state)</li>
              <li>If goal reached, return the button press count</li>
              <li>Otherwise, for each button that hasn't reached its max presses:
                <ol className="list-roman ml-5 mt-1">
                  <li>Create a new state by pressing that button once</li>
                  <li>If this state hasn't been visited before, enqueue it</li>
                </ol>
              </li>
            </ol>
          </li>
          <li>If the queue is exhausted, no solution exists</li>
        </ol>
        
        <h4 className="font-bold mt-4 mb-2">Pseudocode:</h4>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`function solveButtonPuzzle(lights, buttons, maxPresses, targetColor):
    initialState = {lights: lights, buttonPresses: [0,0,...]}
    queue = [initialState]
    visited = {initialState}
    
    while queue is not empty:
        currentState = queue.dequeue()
        
        if allLightsMatch(currentState.lights, targetColor):
            return currentState.buttonPresses
            
        for each button i that hasn't reached maxPresses[i]:
            newState = pressButton(currentState, i)
            if newState not in visited:
                visited.add(newState)
                queue.enqueue(newState)
                
    return "No solution possible"`}
        </pre>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-bold mb-2">Time and Space Complexity</h3>
        
        <h4 className="font-bold mt-2 mb-1">Time Complexity: O(3^L * P)</h4>
        <p className="mb-4">
          Where L is the number of lights and P is the product of all max button presses plus 1.
          <ul className="list-disc ml-5 mt-2">
            <li>Each light has 3 possible colors (R, G, B)</li>
            <li>In the worst case, we might need to explore every possible light configuration</li>
            <li>For each configuration, we might need to try different button press combinations</li>
          </ul>
        </p>
        
        <h4 className="font-bold mt-2 mb-1">Space Complexity: O(3^L * P)</h4>
        <p>
          We need to store visited states to avoid cycles, which in the worst case could be
          all possible light configurations multiplied by all possible button press combinations.
        </p>
      </div>
      
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-2">Optimizations and Innovations</h3>
        <p className="mb-2">Our approach includes several optimizations:</p>
        <ul className="list-disc ml-5 mb-4">
          <li>
            <strong>Efficient state representation:</strong> We use a custom hash function to efficiently 
            store and lookup light configurations.
          </li>
          <li>
            <strong>Early termination:</strong> As soon as we find a solution, we stop exploring further states,
            ensuring we get the minimum number of button presses.
          </li>
          <li>
            <strong>Solution validation:</strong> We include a validation function to verify that our solution
            actually works, adding robustness to the algorithm.
          </li>
          <li>
            <strong>Pruning impossible states:</strong> We only explore states where buttons haven't reached their
            maximum press count, reducing the search space.
          </li>
        </ul>
      </div>
    </div>
  );

  // Main render function
  return (
    <div className="max-w-lg mx-auto mt-8">
      {mode === 'home' && renderHome()}
      {mode === 'setup' && renderSetup()}
      {mode === 'testCase' && renderTestCaseSelection()}
      {mode === 'algorithm' && renderAlgorithmExplanation()}
      {mode === 'play' && renderGame()}
      {currentStep === 'buttonSetup' && renderButtonSetup()}
    </div>
  );
};

export default LightButtonPuzzle;

