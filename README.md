# Lights Puzzle Solver & Game 🎮💡

This repository contains two parts:

1. A **C++ implementation** of a linear algebra-based algorithm to solve a "Lights Puzzle" where each light can be Red (R), Green (G), or Blue (B), and multiple buttons can change the colors of multiple lights.
2. A **React-based web game**, where users can play this puzzle interactively. The backend logic of the game is implemented in **JavaScript**, but the C++ algorithm is included here to demonstrate the formal mathematical model and its design & analysis for academic purposes.

---

## 🔍 Problem Overview

You are given:
- A sequence of lights, each colored R, G, or B.
- A number of buttons, where each button toggles certain lights and cycles their color: R → G → B → R.
- A target color to which all lights must be changed.
- A constraint on how many times each button can be pressed (maximum 0, 1, or 2).

**Goal:** Find the minimum number of button presses (modulo 3 arithmetic) required to convert all lights to the desired color.

---

## 🧠 Algorithm (C++)

The C++ algorithm formulates the puzzle as a system of linear equations over the field **Z₃** (integers modulo 3). It applies:

- Modular arithmetic operations (`add`, `sub`, `mul`, `inv`) over mod 3.
- **Gaussian elimination** to solve the system.
- Enumeration over the null space (free variables) to find the optimal valid solution within button constraints.

### Features

- Solves under constraints of button press limits.
- Efficiently finds a minimal total number of presses.
- Validates solution correctness after solving.

