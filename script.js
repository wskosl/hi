     function greetUser() {
        let name = prompt("What's your name? \n ཁྱེད་རང་གི་མིང་ལ་ག་རེ་རེད།");
        if (name) {
          alert("Tashi Delek བཀྲ་ཤིས་བདེ་ལེགས།, " + name + "! 👋");
        } else {
          alert("You didn't enter a name.");
        }
      }
document.addEventListener("DOMContentLoaded", function () {
  const map = L.map('map').setView([28.3949, 84.1240], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const tracePoints = [
    [29.653, 91.117],   // Lhasa
    [12.2958, 76.6394],  // Mysore
    [32.219, 76.323]     // Dharamshala
  ];
  const pathLine = L.polyline(tracePoints, { color: 'red' }).addTo(map);
  map.fitBounds(pathLine.getBounds());

  L.marker(tracePoints[0]).addTo(map).bindPopup('Lhasa');
  L.marker(tracePoints[1]).addTo(map).bindPopup('Mysore');
  L.marker(tracePoints[2]).addTo(map).bindPopup('Dharamshala');
});
