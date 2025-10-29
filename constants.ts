
import type { MathTopic } from './types';
import { SigmaIcon, RatioIcon, SquareRootIcon, FunctionIcon, InfinityIcon, ShapesIcon } from './components/Icons';

export const MATH_TOPICS: MathTopic[] = [
  {
    name: 'Arithmetic',
    description: 'Master the basics: addition, subtraction, multiplication, and division.',
    icon: SigmaIcon,
  },
  {
    name: 'Algebra',
    description: 'Solve for x, understand variables, and work with equations and functions.',
    icon: FunctionIcon,
  },
  {
    name: 'Geometry',
    description: 'Explore shapes, angles, and the properties of space and figures.',
    icon: ShapesIcon,
  },
  {
    name: 'Trigonometry',
    description: 'Learn about the relationships between angles and sides of triangles.',
    icon: RatioIcon,
  },
  {
    name: 'Pre-Calculus',
    description: 'Prepare for calculus with advanced algebra and trigonometry concepts.',
    icon: SquareRootIcon,
  },
  {
    name: 'Calculus',
    description: 'Dive into derivatives, integrals, and the study of continuous change.',
    icon: InfinityIcon,
  },
];
