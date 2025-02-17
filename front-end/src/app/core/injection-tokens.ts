import { InjectionToken } from '@angular/core';
import * as katex from 'katex';
import * as mathjs from 'mathjs';

export const MATH_JS = new InjectionToken<typeof mathjs>('MathJS library');
export const KATEX = new InjectionToken<typeof katex>('KaTeX Library');
