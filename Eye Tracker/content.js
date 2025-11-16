document.addEventListener("mousemove", (e) => {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  
  if (!el) return;

  console.clear(); // optional, keeps console clean

  // Walk up the DOM tree to log all ancestors
  let current = el;
  const hierarchy = [];

  while (current) {
    let info = current.tagName;
    if (current.id) info += `#${current.id}`;
    if (current.className) info += `.${current.className.replace(/\s+/g, '.')}`;
    hierarchy.push(info);
    current = current.parentElement;
  }

  console.log("Hierarchy under mouse:", hierarchy);
});