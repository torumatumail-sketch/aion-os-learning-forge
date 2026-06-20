const examples = {
  state: {
    title: "状態を変換する",
    goal: "偶数だけを2倍にして返す関数を完成させる",
    code: `function transform(numbers) {
  // 偶数だけを2倍にして返す
  return numbers
    .filter((value) => value % 2 === 0)
    .map((value) => value * 2);
}

const result = transform([1, 2, 3, 4, 5, 6]);
console.log("result:", result);
assertEqual(result, [4, 8, 12], "偶数だけが2倍になる");`,
  },
  language: {
    title: "抽象化を作る",
    goal: "共通処理を関数へ切り出し、意図を名前にする",
    code: `function score(label, points, bonus) {
  return {
    label,
    total: points.reduce((sum, point) => sum + point, 0) + bonus,
  };
}

const math = score("math", [12, 18, 20], 5);
const code = score("code", [10, 20, 30], 0);

console.log(math);
console.log(code);
assertEqual(math.total, 55, "bonusを含めた合計");
assertEqual(code.total, 60, "共通処理を再利用");`,
  },
  async: {
    title: "非同期を観察する",
    goal: "実行順序をログで見て、イベントループの入口をつかむ",
    code: `console.log("A: start");

setTimeout(() => {
  console.log("C: timer task");
  assertEqual(true, true, "timer task executed");
}, 0);

Promise.resolve().then(() => {
  console.log("B: microtask");
  assertEqual(1 + 1, 2, "microtask executed");
});

console.log("D: sync end");`,
  },
};

const editor = document.querySelector("#codeEditor");
const output = document.querySelector("#outputLog");
const runStatus = document.querySelector("#runStatus");
const lessonTitle = document.querySelector("#lessonTitle");
const lessonGoal = document.querySelector("#lessonGoal");
const runButton = document.querySelector("#runCode");
const resetButton = document.querySelector("#resetCode");
const lessons = [...document.querySelectorAll(".lesson")];
let activeExample = "state";

function setExample(key) {
  activeExample = key;
  const example = examples[key];
  editor.value = example.code;
  lessonTitle.textContent = example.title;
  lessonGoal.textContent = example.goal;
  lessons.forEach((lesson) => {
    lesson.classList.toggle("active", lesson.dataset.example === key);
  });
  output.textContent = "Runを押すと、検証結果がここに出ます。";
  runStatus.textContent = "waiting";
}

function runCode() {
  runStatus.textContent = "running";
  output.textContent = "";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const timeout = window.setTimeout(() => {
    output.textContent += "\\n[timeout] 実行が長すぎるため停止しました。";
    runStatus.textContent = "timeout";
    iframe.remove();
  }, 1800);

  window.addEventListener(
    "message",
    (event) => {
      if (event.source !== iframe.contentWindow) return;
      window.clearTimeout(timeout);
      const { logs, assertions, error } = event.data;
      const lines = [];
      if (logs.length) lines.push("console", ...logs.map((line) => `  ${line}`));
      if (assertions.length) {
        lines.push("", "checks");
        assertions.forEach((check) => {
          lines.push(`  ${check.pass ? "PASS" : "FAIL"} ${check.label}`);
        });
      }
      if (error) lines.push("", `error: ${error}`);
      output.textContent = lines.join("\\n") || "No output.";
      runStatus.textContent = error || assertions.some((item) => !item.pass) ? "needs repair" : "passed";
      iframe.remove();
    },
    { once: true },
  );

  iframe.srcdoc = `
    <script>
      const logs = [];
      const assertions = [];
      const safeStringify = (value) => {
        try { return typeof value === "string" ? value : JSON.stringify(value); }
        catch { return String(value); }
      };
      console.log = (...args) => logs.push(args.map(safeStringify).join(" "));
      function assertEqual(actual, expected, label) {
        const pass = JSON.stringify(actual) === JSON.stringify(expected);
        assertions.push({ pass, label });
      }
      try {
        ${editor.value}
        setTimeout(() => parent.postMessage({ logs, assertions, error: null }, "*"), 20);
      } catch (error) {
        parent.postMessage({ logs, assertions, error: error.message }, "*");
      }
    <\/script>
  `;
}

lessons.forEach((lesson) => {
  lesson.addEventListener("click", () => setExample(lesson.dataset.example));
});
runButton.addEventListener("click", runCode);
resetButton.addEventListener("click", () => setExample(activeExample));

setExample("state");

const canvas = document.querySelector("#knowledgeCanvas");
const ctx = canvas.getContext("2d");
const labels = ["State", "Syntax", "Type", "DOM", "Async", "Test", "Design", "AION"];
let nodes = [];

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * ratio);
  canvas.height = Math.floor(canvas.clientHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  nodes = labels.map((label, index) => ({
    label,
    x: 80 + ((index * 137) % Math.max(240, canvas.clientWidth - 160)),
    y: 90 + ((index * 89) % Math.max(220, canvas.clientHeight - 180)),
    vx: (index % 2 ? 0.35 : -0.28),
    vy: (index % 3 ? 0.24 : -0.31),
  }));
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.lineWidth = 1;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < 260) {
        ctx.strokeStyle = `rgba(24, 92, 154, ${0.22 - distance / 1600})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  nodes.forEach((node) => {
    node.x += node.vx;
    node.y += node.vy;
    if (node.x < 40 || node.x > canvas.clientWidth - 40) node.vx *= -1;
    if (node.y < 40 || node.y > canvas.clientHeight - 40) node.vy *= -1;
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.strokeStyle = "rgba(15,107,79,0.32)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(node.x - 42, node.y - 18, 84, 36, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#17201b";
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.label, node.x, node.y);
  });
  requestAnimationFrame(drawCanvas);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawCanvas();
