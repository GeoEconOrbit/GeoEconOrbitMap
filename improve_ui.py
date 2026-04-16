import re

with open('src/App.tsx', 'r') as f:
    text = f.read()

# 1. Update the Main Container
text = text.replace('bg-luxury-black font-serif', 'bg-[#030303] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#050505] to-[#030303] font-serif')

# 2. Update the Top Navigation Bar
text = text.replace('bg-luxury-black/95 border-b border-luxury-gold/30', 
                    'bg-black/30 backdrop-blur-3xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] m-4 rounded-2xl')

# 3. Floating System Log Panel
text = text.replace('bg-luxury-black/95 border-l-2 border-luxury-gold', 
                    'bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]')

# 4. Side Panel Containers (Assuming they use bg-luxury-black/90 or similar)
text = text.replace('bg-luxury-black/90', 'bg-black/50 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]')
text = text.replace('bg-luxury-black/80', 'bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl')
text = text.replace('bg-luxury-black/40', 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl')

# 5. Buttons and Interactive Elements
text = text.replace('border border-luxury-gold/20 hover:bg-luxury-gold/10', 
                    'border border-luxury-gold/20 bg-black/20 hover:bg-luxury-gold/20 rounded-xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]')
text = text.replace('border border-luxury-gold px-4 py-2 hover:bg-luxury-gold/10',
                    'border border-luxury-gold/50 bg-gradient-to-r from-luxury-gold/10 to-transparent px-4 py-2 hover:bg-luxury-gold/20 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-[0_0_10px_rgba(212,175,55,0.1)]')

with open('src/App.tsx', 'w') as f:
    f.write(text)

with open('src/index.css', 'r') as f:
    css = f.read()

# Add a smooth gradient overlay to leaflet popups and make them rounded
css = css.replace('@apply bg-luxury-black/95 text-luxury-bone border border-luxury-gold/30 rounded-none shadow-2xl;',
                  '@apply bg-black/60 text-luxury-bone border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)];\n  backdrop-filter: blur(16px);\n  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);')

with open('src/index.css', 'w') as f:
    f.write(css)

