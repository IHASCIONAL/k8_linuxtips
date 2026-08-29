if (window.mermaid) {
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    themeVariables: {
      background: "#17171d",
      primaryColor: "#1e1e26",
      primaryTextColor: "#e8e8ec",
      primaryBorderColor: "#ff6a1a",
      lineColor: "#ff6a1a",
      secondaryColor: "#17171d",
      tertiaryColor: "#121216",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "14px",
    },
  });
}

async function loadDays() {
  const res = await fetch("data/days.json");
  const data = await res.json();
  return data.days;
}

function dayCardHTML(day) {
  const topicCount = day.topics.length;
  return `
    <a class="day-card" href="day.html?dia=${day.id}">
      <div class="term-bar"><span></span><span></span><span></span></div>
      <div class="body">
        <div class="tag">DIA ${day.id}</div>
        <h3>${day.title}</h3>
        <p>${day.description}</p>
        <div class="meta">
          <span>${topicCount} anotaç${topicCount === 1 ? "ão" : "ões"}</span>
          <span class="arrow">acessar &rarr;</span>
        </div>
      </div>
    </a>
  `;
}

function nextDayPlaceholderHTML(nextId) {
  return `
    <div class="day-card disabled">
      <div class="term-bar"><span></span><span></span><span></span></div>
      <div class="body">
        <div class="tag">DIA ${nextId}</div>
        <h3>Em breve</h3>
        <p>Ainda não iniciado. Continue os estudos para desbloquear.</p>
        <div class="meta">
          <span>&mdash;</span>
          <span>bloqueado</span>
        </div>
      </div>
    </div>
  `;
}

async function initIndex() {
  const grid = document.getElementById("day-grid");
  const days = await loadDays();
  grid.innerHTML = days.map(dayCardHTML).join("");

  const lastId = parseInt(days[days.length - 1].id, 10);
  const nextId = String(lastId + 1).padStart(2, "0");
  grid.insertAdjacentHTML("beforeend", nextDayPlaceholderHTML(nextId));
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function initDay() {
  const dayId = getQueryParam("dia") || "01";
  const days = await loadDays();
  const day = days.find((d) => d.id === dayId);

  const titleEl = document.getElementById("day-title");
  const descEl = document.getElementById("day-desc");
  const sidebarEl = document.getElementById("topic-list");
  const fileNameEl = document.getElementById("file-name");
  const contentEl = document.getElementById("markdown-content");

  if (!day) {
    titleEl.textContent = "Dia não encontrado";
    descEl.textContent = "Verifique o link ou volte para a página inicial.";
    return;
  }

  titleEl.textContent = `Dia ${day.id} — ${day.title}`;
  descEl.textContent = day.description;

  sidebarEl.innerHTML = day.topics
    .map(
      (t, i) =>
        `<div class="topic-link${i === 0 ? " active" : ""}" data-file="${t.file}" data-title="${t.title}">${t.title}</div>`
    )
    .join("");

  async function renderTopic(file, title) {
    fileNameEl.textContent = `${day.folder}/${file}`;
    document
      .querySelectorAll(".topic-link")
      .forEach((el) => el.classList.toggle("active", el.dataset.file === file));

    try {
      const res = await fetch(`${day.folder}/${file}`);
      const text = await res.text();

      if (!text.trim()) {
        contentEl.outerHTML = `
          <div class="empty-note" id="markdown-content">
            <div class="icon">$_</div>
            <p>Este arquivo ainda está vazio.</p>
            <p>Escreva suas anotações em <code>${day.folder}/${file}</code> e recarregue a página.</p>
          </div>`;
        return;
      }

      const html = marked.parse(text);
      const wrapper = document.createElement("div");
      wrapper.id = "markdown-content";
      wrapper.className = "markdown-body";
      wrapper.innerHTML = html;
      document.getElementById("markdown-content").replaceWith(wrapper);

      const mermaidBlocks = wrapper.querySelectorAll("pre code.language-mermaid");
      mermaidBlocks.forEach((block) => {
        const div = document.createElement("div");
        div.className = "mermaid";
        div.textContent = block.textContent;
        block.parentElement.replaceWith(div);
      });

      wrapper.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));

      if (mermaidBlocks.length && window.mermaid) {
        mermaid.run({ nodes: wrapper.querySelectorAll(".mermaid") });
      }
    } catch (err) {
      contentEl.innerHTML = `<div class="empty-note"><div class="icon">!</div><p>Não foi possível carregar <code>${day.folder}/${file}</code>.</p><p>Rode este site com um servidor local (ex: <code>python3 -m http.server</code>) em vez de abrir o arquivo diretamente.</p></div>`;
    }
  }

  sidebarEl.querySelectorAll(".topic-link").forEach((el) => {
    el.addEventListener("click", () => renderTopic(el.dataset.file, el.dataset.title));
  });

  renderTopic(day.topics[0].file, day.topics[0].title);
}
