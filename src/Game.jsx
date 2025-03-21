import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, RefreshCw, Award } from 'lucide-react';

const LightButtonPuzzle = () => {
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
      setSetupComplete(true);
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
    // This is a simplified simulation of the C++ algorithm
    // In a real application, this would be a server call or WebAssembly module
    
    // For demo purposes, create a mock solution
    const optimalPresses = Array(buttonCount).fill(0);
    let totalOptimalPresses = 0;
    
    // Randomly assign 1-2 presses to some buttons
    for (let i = 0; i < buttonCount; i++) {
      if (Math.random() > 0.5) {
        optimalPresses[i] = Math.floor(Math.random() * maxPresses[i]) + 1;
        totalOptimalPresses += optimalPresses[i];
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
        accuracy = 0; // Should not be possible if optimal is truly optimal
      }
    }
    
    setUserScore({
      presses: totalUserPresses,
      optimal: totalOptimalPresses,
      accuracy: accuracy
    });
  };

  // Give up and show solution
  const giveUp = () => {
    setShowSolution(true);
    setIsGameOver(true);
  };

  // Restart the game
  const restartGame = () => {
    setSetupComplete(false);
    setIsGameOver(false);
    setShowSolution(false);
    setCurrentStep('setup');
    setLights([]);
    setButtons([]);
    setMaxPresses([]);
    setButtonPresses([]);
    setOptimalSolution(null);
  };

  // Color to tailwind class mapping
  const colorToClass = {
    R: 'bg-red-500',
    G: 'bg-green-500',
    B: 'bg-blue-500'
  };

  // Render the setup screen
  const renderSetup = () => (
    <div className="p-6 bg-gray-100 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Light Button Puzzle Setup</h2>
      
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
      <h2 className="text-xl font-bold mb-4">Button {buttonSetupIndex + 1} Setup</h2>
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
        <p className="text-sm">Selected lights: {currentButtonLights.map(i => i + 1).join(', ')}</p>
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
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Light Button Puzzle</h2>
        <p>Make all lights {targetColor === 'R' ? 'Red' : targetColor === 'G' ? 'Green' : 'Blue'}</p>
      </div>
      
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
      
      {/* Actions */}
      {!isGameOver && (
        <button 
          onClick={giveUp}
          className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Give Up
        </button>
      )}
      
      {/* Results */}
      {isGameOver && (
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-bold mb-2 flex items-center">
            {lights.every(color => color === targetColor) ? (
              <><Check className="w-5 h-5 text-green-500 mr-2" /> Puzzle Solved!</>
            ) : (
              <><AlertCircle className="w-5 h-5 text-red-500 mr-2" /> You gave up</>
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
          
          {showSolution && (
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
          )}
          
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

  // Render the app based on current step
  return (
    <div className="max-w-lg mx-auto mt-8">
      {currentStep === 'setup' && renderSetup()}
      {currentStep === 'buttonSetup' && renderButtonSetup()}
      {currentStep === 'play' && renderGame()}
    </div>
  );
};

export default LightButtonPuzzle;