import { TrustBar } from './TrustBar';
import { ThreeHero } from './ThreeHero';

export function Hero() {
  return (
    <div className="flex flex-col">
      <ThreeHero />
      <TrustBar />
    </div>
  );
}
