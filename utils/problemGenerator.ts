import React from 'react';
import type { GameProblem, MentalMathProblem, AlgebraProblem, NumberSequenceProblem, GeometryProblem, Difficulty } from '../types';
import { ComponentType } from 'react';

// --- Shape Components (for Geometry Game) ---
// Fix: Replaced JSX syntax with React.createElement to resolve parsing errors in a .ts file.
const SquareShape: ComponentType<{ className?: string }> = ({ className }) => React.createElement('svg', { className, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "5" },
  React.createElement('rect', { x: "15", y: "15", width: "70", height: "70" })
);
const CircleShape: ComponentType<{ className?: string }> = ({ className }) => React.createElement('svg', { className, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "5" },
  React.createElement('circle', { cx: "50", cy: "50", r: "35" })
);
const TriangleShape: ComponentType<{ className?: string }> = ({ className }) => React.createElement('svg', { className, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "5" },
  React.createElement('path', { d: "M50 15 L85 85 L15 85 Z" })
);
const PentagonShape: ComponentType<{ className?: string }> = ({ className }) => React.createElement('svg', { className, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "5" },
  React.createElement('path', { d: "M50 10 L90 40 L75 90 L25 90 L10 40 Z" })
);
const HexagonShape: ComponentType<{ className?: string }> = ({ className }) => React.createElement('svg', { className, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "5" },
  React.createElement('path', { d: "M50 10 L93.3 35 V 85 L50 110 L6.7 85 V 35 Z", transform: "scale(0.8) translate(7, -2)" })
);
const CubeShape: ComponentType<{ className?: string }> = ({ className }) => React.createElement('svg', { className, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: "4" },
  React.createElement('path', { d: "M25 25h50v50h-50z M25 25l20-15h50l-20 15 M75 25v50 M95 10v50 M45 10h50 M45 60h50" })
);


const GEOMETRY_PROBLEMS: Record<Difficulty, Omit<GeometryProblem, 'type'>[]> = {
    Easy: [
        { shapeComponent: SquareShape, question: "How many sides does this shape have?", options: ["3", "4", "5", "8"], answer: "4" },
        { shapeComponent: CircleShape, question: "How many vertices (corners) does this shape have?", options: ["0", "1", "2", "4"], answer: "0" },
        { shapeComponent: TriangleShape, question: "What is the name of this shape?", options: ["Triangle", "Square", "Circle", "Pentagon"], answer: "Triangle" },
        { shapeComponent: SquareShape, question: "All angles in this shape are...", options: ["Acute", "Obtuse", "Right (90°)", "Straight"], answer: "Right (90°)" },
    ],
    Medium: [
        { shapeComponent: PentagonShape, question: "How many vertices does a pentagon have?", options: ["4", "5", "6", "7"], answer: "5" },
        { shapeComponent: HexagonShape, question: "What is the sum of interior angles in a hexagon?", options: ["360°", "540°", "720°", "900°"], answer: "720°" },
        { shapeComponent: TriangleShape, question: "What is the sum of angles in any triangle?", options: ["90°", "180°", "270°", "360°"], answer: "180°" },
        { shapeComponent: PentagonShape, question: "What is this shape called?", options: ["Hexagon", "Octagon", "Square", "Pentagon"], answer: "Pentagon" },
    ],
    Hard: [
        { shapeComponent: CubeShape, question: "How many faces does a cube have?", options: ["4", "6", "8", "12"], answer: "6" },
        { shapeComponent: CubeShape, question: "How many edges does a cube have?", options: ["6", "8", "10", "12"], answer: "12" },
        { shapeComponent: CubeShape, question: "How many vertices does a cube have?", options: ["4", "6", "8", "12"], answer: "8" },
        { shapeComponent: SquareShape, question: "If one side is 5 units, what is the area?", options: ["10", "20", "25", "30"], answer: "25" },
    ],
};

export const generateSprintProblem = (difficulty: Difficulty, prng: () => number = Math.random): MentalMathProblem => {
    const operatorsMap: { [key in Difficulty]: ('+' | '-' | '×')[] } = {
        Easy: ['+', '-'],
        Medium: ['+', '-', '×'],
        Hard: ['+', '-', '×'],
    };

    const operators = operatorsMap[difficulty];
    const operator = operators[Math.floor(prng() * operators.length)];

    let num1: number, num2: number, answer: number;

    switch (difficulty) {
        case 'Easy':
            num1 = Math.floor(prng() * 20) + 1;
            num2 = Math.floor(prng() * 20) + 1;
            break;
        case 'Medium':
            if (operator === '×') {
                num1 = Math.floor(prng() * 11) + 2; // 2-12
                num2 = Math.floor(prng() * 11) + 2; // 2-12
            } else {
                num1 = Math.floor(prng() * 41) + 10; // 10-50
                num2 = Math.floor(prng() * 41) + 10; // 10-50
            }
            break;
        case 'Hard':
            if (operator === '×') {
                num1 = Math.floor(prng() * 16) + 10; // 10-25
                num2 = Math.floor(prng() * 11) + 2;  // 2-12
            } else {
                num1 = Math.floor(prng() * 76) + 25; // 25-100
                num2 = Math.floor(prng() * 76) + 25; // 25-100
            }
            break;
    }

    switch (operator) {
        case '+': answer = num1 + num2; break;
        case '×': answer = num1 * num2; break;
        case '-':
            if (num1 < num2) [num1, num2] = [num2, num1];
            answer = num1 - num2;
            break;
    }

    return { type: 'sprint', num1, num2, operator, answer };
};
    
export const generateAlgebraProblem = (difficulty: Difficulty, prng: () => number = Math.random): AlgebraProblem => {
    let equation = '';
    let answer = 0;

    switch (difficulty) {
        case 'Easy': { // One-step equations
            const type = Math.floor(prng() * 3);
            const a = Math.floor(prng() * 20) + 1;
            answer = Math.floor(prng() * 10) + 2; // 2 to 11
            if (type === 0) { // x + a = b
                equation = `x + ${a} = ${answer + a}`;
            } else if (type === 1) { // x - a = b
                equation = `x - ${a} = ${answer - a}`;
            } else { // ax = c
                const multiplier = Math.floor(prng() * 9) + 2; // 2 to 10
                equation = `${multiplier}x = ${multiplier * answer}`;
            }
            break;
        }
        case 'Medium': { // Two-step equations
            const a = Math.floor(prng() * 9) + 2; // 2 to 10
            const b = Math.floor(prng() * 20) + 1;
            answer = Math.floor(prng() * 10) + 2; // 2 to 11
            if (prng() > 0.5) { // ax + b = c
                equation = `${a}x + ${b} = ${a * answer + b}`;
            } else { // ax - b = c
                equation = `${a}x - ${b} = ${a * answer - b}`;
            }
            break;
        }
        case 'Hard': { // Variables on both sides
            const c_h = Math.floor(prng() * 5) + 2; // 2 to 6
            const a_h = c_h + Math.floor(prng() * 5) + 2; // a > c to ensure positive x
            answer = Math.floor(prng() * 8) + 2; // 2 to 9
            const diff = (a_h - c_h) * answer;
            const b_h = Math.floor(prng() * 20) + 1;
            const d_h = b_h + diff;
            equation = `${a_h}x + ${b_h} = ${c_h}x + ${d_h}`;
            break;
        }
    }
    return { type: 'algebra', equation, answer };
};

export const generateSequenceProblem = (difficulty: Difficulty, prng: () => number = Math.random): NumberSequenceProblem => {
    let sequence: number[] = [];
    let answer = 0;
    const length = 5;

    switch (difficulty) {
        case 'Easy': { // Arithmetic sequence
            const start = Math.floor(prng() * 20) + 1;
            const diff = Math.floor(prng() * 4) + 2; // diff from 2 to 5
            for (let i = 0; i < length; i++) {
                sequence.push(start + i * diff);
            }
            break;
        }
        case 'Medium': { // Arithmetic or simple Geometric
            if (prng() > 0.5) { // Arithmetic
                const start = Math.floor(prng() * 50) + 1;
                const diff = Math.floor(prng() * 9) + 2; // diff from 2 to 10
                for (let i = 0; i < length; i++) {
                    sequence.push(start + i * diff);
                }
            } else { // Geometric
                let start = Math.floor(prng() * 5) + 1; // 1 to 5
                const ratio = Math.floor(prng() * 2) + 2; // ratio of 2 or 3
                for (let i = 0; i < length; i++) {
                    sequence.push(start);
                    start *= ratio;
                }
            }
            break;
        }
        case 'Hard': { // More complex patterns
            const patternType = Math.floor(prng() * 3);
            if (patternType === 0) { // Arithmetic with negative diff
                const start = Math.floor(prng() * 50) + 50; // 50 to 99
                const diff = -(Math.floor(prng() * 9) + 2); // diff from -2 to -10
                for (let i = 0; i < length; i++) {
                    sequence.push(start + i * diff);
                }
            } else if (patternType === 1) { // Fibonacci-like
                let n1 = Math.floor(prng() * 5) + 1;
                let n2 = Math.floor(prng() * 5) + 1 + n1;
                sequence.push(n1, n2);
                for (let i = 2; i < length; i++) {
                    const sum = sequence[i-1] + sequence[i-2];
                    sequence.push(sum);
                }
            } else { // Two-step pattern (ax + b)
                let current = Math.floor(prng() * 5) + 1;
                const multiplier = Math.floor(prng() * 3) + 2; // 2 or 3 or 4
                const adder = Math.floor(prng() * 5) + 1; // 1 to 5
                for (let i = 0; i < length; i++) {
                    sequence.push(current);
                    current = current * multiplier + adder;
                }
            }
            break;
        }
    }

    const missingIndex = Math.floor(prng() * (length - 2)) + 1; // index 1, 2, or 3
    answer = sequence[missingIndex];

    const displaySequence = sequence.map((val, index) => index === missingIndex ? '?' : val) as (number | string)[];
    
    return { type: 'sequence', sequence: displaySequence, answer };
};

export const generateGeometryProblem = (difficulty: Difficulty, prng: () => number = Math.random): GeometryProblem => {
    const problemSet = GEOMETRY_PROBLEMS[difficulty];
    const randomProblem = problemSet[Math.floor(prng() * problemSet.length)];
    return { type: 'geometry', ...randomProblem };
};