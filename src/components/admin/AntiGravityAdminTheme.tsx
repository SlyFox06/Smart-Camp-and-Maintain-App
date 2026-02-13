
import React, { useEffect, useRef } from 'react';

const AntiGravityAdminTheme = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];

        // Colors
        const colors = ['#00D4FF', '#3B82F6', '#9D4EDD', '#EC4899', '#10B981'];

        class Particle {
            x: number;
            y: number;
            size: number;
            speedY: number;
            color: string;
            opacity: number;

            constructor(w: number, h: number) {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.size = Math.random() * 2 + 0.5; // Small cyan dots
                this.speedY = Math.random() * 0.5 + 0.1;
                this.color = Math.random() > 0.7 ? '#00D4FF' : '#3B82F6';
                this.opacity = Math.random() * 0.2 + 0.1;
            }

            update(h: number) {
                this.y -= this.speedY;
                if (this.y < 0) {
                    this.y = h;
                    this.opacity = Math.random() * 0.2 + 0.1;
                }
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        const init = () => {
            particles = [];
            const particleCount = Math.floor((canvas.width * canvas.height) / 10000); // Density
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(canvas.width, canvas.height));
            }
        };

        const render = () => {
            // Main Background: Deep space black with gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#000000');
            gradient.addColorStop(0.5, '#0A0E27');
            gradient.addColorStop(1, '#1A0B2E');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Particle Overlay
            particles.forEach(p => {
                p.update(canvas.height);
                p.draw(ctx);
            });

            // Secondary Background Effect (Dark navy glow at bottom)
            const glow = ctx.createRadialGradient(canvas.width / 2, canvas.height, 0, canvas.width / 2, canvas.height, canvas.height * 0.5);
            glow.addColorStop(0, 'rgba(15, 22, 41, 0.4)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
        />
    );
};

export default AntiGravityAdminTheme;
