     function greetUser() {
        let name = prompt("What's your name? \n ཁྱེད་རང་གི་མིང་ལ་ག་རེ་རེད།");
        if (name) {
          alert("Tashi Delek བཀྲ་ཤིས་བདེ་ལེགས།, " + name + "! 👋");
        } else {
          alert("You didn't enter a name.");
        }
      }
const map = L.map('map').setView([28.3949, 84.1240], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
 const tracePoints = [
      [29.653, 91.117],   // Lhasa
      [27.7172, 85.324],  // Kathmandu
      [32.219, 76.323]    // Dharamshala
    ];
