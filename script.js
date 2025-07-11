// This function runs when the button is clicked
/*      function greetUser() {
        let name = prompt("What's your name? \n ཁྱེད་རང་གི་མིང་ལ་ག་རེ་རེད།");
        if (name) {
          alert("Tashi Delek བཀྲ་ཤིས་བདེ་ལེགས།, " + name + "! 👋");
        } else {
          alert("You didn't enter a name.");
        }
      }
      */
// Initialize the map centered near Yumbhu Lhakhang
  // Initialize the map centered between Lhoka and Lhasa
  const map = L.map('map').setView([30.5, 85], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const yumbhulhagang = [29.2333, 91.7667];
  const lhasa = [29.6578, 91.1175];
  const dharamsala = [32.2207, 76.3203]; 


  const storyPanel = document.getElementById('story-panel');

  // Marker for Yumbhu Lhakhang
  L.marker(yumbhulhagang).addTo(map)
    .bindPopup("📍 Lhokha")
    .on('click', () => {
      storyPanel.innerHTML = `
        <h2>📖 Lhokha</h2>
        <p><strong>Yumbhu Lhakhang</strong> is Tibet’s first palace, said to be built for King Nyatri Tsenpo in the 2nd century BCE. It marks the legendary beginning of Tibetan kingship in the Yarlung Valley. Perched on a hill, it later became a shrine and monastery during the reign of the 5th Dalai Lama.</p>
      `;
    });

  // Marker for Lhasa
  L.marker(lhasa).addTo(map)
    .bindPopup("📍 Lhasa")
    .on('click', () => {
      storyPanel.innerHTML = `
        <h2>📖 Lhasa</h2>
        <p><strong>Lhasa</strong> became the capital of Tibet during the 7th century under King Songtsen Gampo. With the construction of the Potala Palace and Jokhang Temple, it evolved into the center of Tibetan political power and Buddhist life — a place of unification and pilgrimage.</p>
      `;
    });
    // Marker for Dharamsala
      L.marker(dharamsala).addTo(map)
        .bindPopup("📍 Dharamshala")
        .on('click', () => {
          storyPanel.innerHTML = `
            <h2>📖 Dharamshala</h2>
            <p>After the 1959 uprising in Lhasa, His Holiness the 14th Dalai Lama fled Tibet and found refuge in Dharamsala, India. There, the Tibetan Government-in-Exile was established — not just as a political structure, but as a cultural lifeline. In this Himalayan town, Tibetans rebuilt schools, monasteries, and institutions to preserve their language, religion, and identity. Though far from their homeland, Dharamsala has become the third symbolic capital of Tibet — a place where memory, resilience, and hope continue to thrive. </p>
          `;
        });
  const path = L.polyline([yumbhulhagang, lhasa, dharamsala], {
    color: 'red',
    weight: 4
  }).addTo(map);

  map.fitBounds(path.getBounds(), {
    paddingTopLeft: [50, 50],
    paddingBottomRight: [50, 50],
    maxZoom: 7
  });


// My image slide with captions
      const slides = document.querySelectorAll('.carousel-slide');
      let current = 0;

      document.querySelector('.next-btn').addEventListener('click', () => {
        slides[current].classList.add('hidden');
        current = (current + 1) % slides.length;
        slides[current].classList.remove('hidden');
      });

      document.querySelector('.prev-btn').addEventListener('click', () => {
        slides[current].classList.add('hidden');
        current = (current - 1 + slides.length) % slides.length;
        slides[current].classList.remove('hidden');
      });

// Three capitals story block
     const storyBlocks = document.querySelectorAll('.story-block');

    const revealOnScroll = () => {
      storyBlocks.forEach(block => {
        const top = block.getBoundingClientRect().top;
        const bottom = block.getBoundingClientRect().bottom;

        if (top < window.innerHeight * 0.85 && bottom > 0) {
          block.classList.add('revealed');
        } else {
          block.classList.remove('revealed'); // Remove on scroll out
        }
      });
    };

    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('load', revealOnScroll);
