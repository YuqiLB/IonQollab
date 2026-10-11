// Qollab entry point. Keep the standard browser preview on main.js so it can
// run without Qollab's Python module resolver or injected Qiskit backend.
import * as quantum from 'quantum.attack';
import { configureQollab } from './js/quantum-adapter.js';

if (typeof backend === 'undefined' || backend == null) {
  throw new Error('Qollab did not provide a Qiskit backend. Select a simulator before starting the project.');
}

configureQollab({ runAttack: quantum.run_attack, backend });

// Start the UI only after the live Qiskit bridge has been configured.
await import('./main.js');
