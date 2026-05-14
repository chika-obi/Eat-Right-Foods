import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Environment, Float, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { ChevronRight, Leaf, Clock, MapPin, ChevronLeft } from 'lucide-react';
import { CONTACT_INFO } from '../constants';
import signatureMeal from '../assets/images/healthy_swallow_soup_1778705674948.png';

const slides = [
  {
    id: 0,
    title: "HEALTHY MEAL",
    highlight: "SUBSCRIPTIONS",
    description: "Experience the best of Nigerian nutrition. We deliver gourmet, calorie-controlled meals across Port Harcourt every day.",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=2000",
    color: "#2C7A32"
  },
  {
    id: 1,
    title: "FRESH ORGANIC",
    highlight: "INGREDIENTS",
    description: "From farm to table. We source only the freshest organic produce for your maximum health benefits and vital energy.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=2000",
    color: "#4CAF50"
  },
  {
    id: 2,
    title: "CUSTOMIZED",
    highlight: "NUTRITION",
    description: "Whether you want to lose weight or build muscle, our expert nutritionists design the perfect plan for your fitness journey.",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=2000",
    color: "#1B5E20"
  }
];

function Scene({ currentSlide }: { currentSlide: number }) {
  const textures = useTexture(slides.map(s => s.image));
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  
  const [prevSlide, setPrevSlide] = useState(0);
  const [transition, setTransition] = useState(0);

  useEffect(() => {
    setTransition(0);
    const timeout = setTimeout(() => {
      setPrevSlide(currentSlide);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [currentSlide]);

  useFrame((state, delta) => {
    if (transition < 1) {
      setTransition(prev => Math.min(prev + delta * 1.5, 1));
    }
    if (materialRef.current) {
      materialRef.current.uTransition = transition;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef} scale={[12, 8, 1]} position={[0, 0, -2]}>
          <planeGeometry args={[1, 1, 32, 32]} />
          <shaderMaterial
            ref={materialRef}
            transparent
            uniforms={{
              uTex1: { value: textures[prevSlide] },
              uTex2: { value: textures[currentSlide] },
              uTransition: { value: 0 },
              uResolution: { value: new THREE.Vector2(1, 1) },
              uTime: { value: 0 }
            }}
            vertexShader={`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform sampler2D uTex1;
              uniform sampler2D uTex2;
              uniform float uTransition;
              varying vec2 vUv;

              void main() {
                vec4 t1 = texture2D(uTex1, vUv);
                vec4 t2 = texture2D(uTex2, vUv);
                
                // Fade transition
                gl_FragColor = mix(t1, t2, smoothstep(0.0, 1.0, uTransition));
                gl_FragColor.rgb *= 0.4; // Darken for readablity
              }
            `}
          />
        </mesh>
      </Float>
    </>
  );
}

export function ThreeHero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative min-h-[100vh] md:h-[90vh] md:min-h-[750px] flex items-start md:items-center pt-28 md:pt-40 pb-12 overflow-hidden bg-slate-950 border-b border-white/5">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <Suspense fallback={null}>
            <Scene currentSlide={currentSlide} />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent z-[1]" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-8 w-full z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="max-w-3xl text-center lg:text-left">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="flex flex-col items-center lg:items-start"
            >
              <div className="inline-flex items-center gap-2 bg-brand-green/20 backdrop-blur-md border border-brand-green/30 px-4 py-1.5 rounded-full text-brand-green text-[10px] font-black uppercase tracking-[0.2em] mb-10">
                <Leaf size={14} />
                <span>Harvested with Integrity</span>
              </div>
 
              <h1 className="text-5xl sm:text-7xl md:text-9xl font-display font-medium text-white leading-[0.82] tracking-tighter mb-10">
                {slides[currentSlide].title} <br />
                <span className="text-brand-green italic font-light">{slides[currentSlide].highlight}</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-xl font-medium">
                {slides[currentSlide].description}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6">
                <a 
                  href="#menu" 
                  className="bg-brand-green hover:bg-brand-green/90 text-white px-10 py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 transition-all shadow-2xl shadow-brand-green/30 group"
                >
                  Explore Collection
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=Hello,%20I%20would%20like%20to%20learn%20more%20about%20your%20Healthy%20Meal%20Subscription%20Plans.`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all"
                >
                  Subscriptions
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
 
          <div className="mt-16 flex items-center justify-center lg:justify-start gap-8">
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentSlide === idx ? "w-12 bg-brand-green" : "w-6 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={prevSlide}
                className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-white hover:bg-white/5 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextSlide}
                className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-white hover:bg-white/5 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="relative w-full lg:w-[500px] flex justify-center lg:block mt-20 md:mt-24 lg:mt-0 pb-10 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.5, rotate: -20, y: 100 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 20, y: -100 }}
              transition={{ duration: 1, type: "spring", bounce: 0.4 }}
              className="relative z-30"
            >
              <a href="#menu" className="block relative group cursor-pointer">
                <div className="w-[260px] h-[260px] md:w-[450px] md:h-[450px] rounded-full border-[10px] md:border-[15px] border-white/5 shadow-2xl overflow-hidden">
                  <img 
                    src={signatureMeal} 
                    alt="Signature Meal" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                </div>
                
                <motion.div 
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-6 -right-6 md:-top-10 md:-right-10 bg-brand-green text-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] font-display font-bold text-center text-sm md:text-base leading-tight shadow-2xl border-4 border-white/10 z-20"
                >
                  EAT RIGHT,<br />FEEL LIGHT!
                </motion.div>

                <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-2 md:gap-3 z-20">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-green/10 rounded-lg md:rounded-xl flex items-center justify-center text-brand-green">
                      <Clock size={16} />
                   </div>
                   <div>
                      <div className="text-[8px] md:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fast Delivery</div>
                      <div className="text-xs md:text-sm font-bold text-slate-800">Under 45 Mins</div>
                   </div>
                </div>
              </a>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
