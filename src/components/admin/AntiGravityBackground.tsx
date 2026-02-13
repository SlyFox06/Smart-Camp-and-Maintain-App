import React, { useRef, useEffect } from 'react';

// Deep Space / Sci-Fi Palette
const colors = ['#00D4FF', '#9D4EDD', '#FFFFFF', '#FF00FF', '#4F46E5'];

class Particle {
    x: number;
    y: number;
    z: number;
    size: number;
    speedY: number;
    speedX: number;
    color: string;
    shape: 'circle' | 'square' | 'triangle';
    rotation: number;
    rotationSpeed: number;
    swayAmplitude: number;
    swayFrequency: number;
    swayOffset: number;

    constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h; // Start mapped across screen
        this.z = Math.random() * 2 + 0.5; // Depth factor
        this.size = (Math.random() * 8 + 2) * this.z; // Scale by depth
        this.speedY = (Math.random() * 0.4 + 0.1) * this.z; // Upload float
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.shape = Math.random() > 0.6 ? 'circle' : Math.random() > 0.5 ? 'square' : 'triangle';
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 1.5;
        this.swayAmplitude = Math.random() * 2;
        this.swayFrequency = Math.random() * 0.02 + 0.01;
        this.swayOffset = Math.random() * 1000;
    }

    respawn(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = h + this.size + 10;
        this.z = Math.random() * 2 + 0.5;
        this.size = (Math.random() * 8 + 2) * this.z;
        this.speedY = (Math.random() * 0.4 + 0.1) * this.z;
    }

    update(w: number, h: number, mouse: { x: number, y: number }) {
        // Anti-gravity rise
        this.y -= this.speedY;
        this.x += this.speedX;

        // Sway motion (Sine wave)
        this.x += Math.sin(Date.now() * 0.001 * this.swayFrequency + this.swayOffset) * 0.3;

        // Rotation
        this.rotation += this.rotationSpeed;

        // Mouse Interaction (Global Repulsion)
        if (mouse.x > 0 && mouse.y > 0) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 250;

            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                const directionX = dx / distance;
                const directionY = dy / distance;
                const repulsionStrength = 6;

                this.x += directionX * force * repulsionStrength;
                this.y += directionY * force * repulsionStrength;
            }
        }

        // Respawn if off top
        if (this.y < -this.size - 50) {
            this.respawn(w, h);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);

        // Opacity based on Z-depth (fog effect)
        ctx.globalAlpha = Math.min(this.z * 0.3, 0.8);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;

        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'square') {
            if (Math.random() > 0.98) { // Rare glitch fill
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            } else {
                ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
            }
        } else if (this.shape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
    }
}

const AntiGravityBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const mouse = useRef({ x: -1000, y: -1000 });
    const animationFrameId = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const init = () => {
            particles.current = [];
            // Responsive particle count
            const particleCount = Math.floor((canvas.width * canvas.height) / 12000);
            for (let i = 0; i < particleCount; i++) {
                particles.current.push(new Particle(canvas.width, canvas.height));
            }
        };

        const render = () => {
            // Deep Space Gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#020024'); // Black
            gradient.addColorStop(0.5, '#090979'); // Deep Blue
            gradient.addColorStop(1, '#1a0b2e'); // Deep Purple/Black

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and Draw Particles
            particles.current.forEach(p => {
                p.update(canvas.width, canvas.height, mouse.current);
                p.draw(ctx);
            });

            animationFrameId.current = requestAnimationFrame(render);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };

        const handleClick = (e: MouseEvent) => {
            // Spawn burst on click
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            for (let i = 0; i < 6; i++) {
                const p = new Particle(canvas.width, canvas.height);
                p.x = x;
                p.y = y;
                p.speedY = (Math.random() - 0.5) * 8;
                p.speedX = (Math.random() - 0.5) * 8;
                p.size = Math.random() * 10 + 2;
                particles.current.push(p);
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        // Attach click to canvas only, so buttons still work without spawning particles
        canvas.addEventListener('click', handleClick);

        handleResize(); // Initial setup
        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('click', handleClick);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-auto"
            style={{ zIndex: 0 }}
        />
    );
};

export default AntiGravityBackground;
