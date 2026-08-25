import { render } from 'preact';
import { App } from './App';
import './styles/global.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app root element');
}
render(<App />, root);
