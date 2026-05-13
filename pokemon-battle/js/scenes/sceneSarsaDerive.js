/* Scene — deriving the SARSA update rule.
 *
 *   Seven cards stacked vertically, revealed one at a time by clicking
 *   STEP. Each card is one step in the chain:
 *
 *     1. Initialise q (typewriter — our table estimate of the
 *        mathematical Q).
 *     2. ε-greedy gives us an action.
 *     3. One transition (s, a, r, s′, a′).
 *     4. Bellman identity:        Q(s,a) = E[r + γ Q(s′,a′)].
 *     5. Sample approximation:    Q(s,a) ≈ r + γ Q(s′,a′).
 *     6. Substitute q for Q:      target = r + γ q[s′,a′].
 *     7. Robbins-Monro update:    q[s,a] ← q[s,a] + α (target − q[s,a]).
 *
 *   That last line is SARSA.
 *
 *   Capital Q (math, red) and typewriter q (table, blue) are kept
 *   visually distinct so the substitution in steps 5→6 is obvious.
 */
(function () {
  window.scenes = window.scenes || {};

  /* Each entry is rendered into a card. `latex` may be an array of
     formulas; `body` is HTML for prose lines (kept short). */
  const CARDS = [
    {
      num: '1 / 7',
      title: 'INITIALISE THE ESTIMATE',
      body:
        'We don\'t know <span class="sd-q">Q(s, a)</span> — that\'s what we\'re after. ' +
        'Build a table <span class="sd-q-est">q[s, a]</span> that holds our guess, and seed it with small random noise.',
      latex: [
        String.raw`\mathtt{q}[s, a] \;\leftarrow\; \text{small random noise}`,
        String.raw`\mathtt{q}[s, a] \;\ne\; Q(s, a) \quad \text{(yet)}`,
      ],
    },
    {
      num: '2 / 7',
      title: 'ε-GREEDY GIVES US AN ACTION',
      body:
        'In state <span class="sd-q">s</span>, pick the next action by ε-greedy on the <em>current</em> table.',
      latex: [
        String.raw`a \;=\; \begin{cases} \text{uniform random} & \text{w.p. } \varepsilon \\[2pt] \operatorname*{arg\,max}_{a'} \mathtt{q}[s, a'] & \text{w.p. } 1 - \varepsilon \end{cases}`,
      ],
    },
    {
      num: '3 / 7',
      title: 'ONE TRANSITION',
      body:
        'Play <span class="sd-q">a</span>. Observe reward <span class="sd-rew">r</span> and new state <span class="sd-q">s′</span>. ' +
        'Pick <span class="sd-q">a′</span> at <span class="sd-q">s′</span> by ε-greedy again — this second &laquo;A&raquo; is what gives <b>SARSA</b> its name.',
      latex: [
        String.raw`\underbrace{(\,s,\; a,\; r,\; s',\; a'\,)}_{\text{one transition}}`,
      ],
    },
    {
      num: '4 / 7',
      title: 'BELLMAN IDENTITY (THE MATHEMATICAL Q)',
      body:
        'By definition of <span class="sd-q">Q</span>, the value at (s, a) decomposes:',
      latex: [
        String.raw`Q(s, a) \;=\; \mathbb{E}\!\left[\, r \;+\; \gamma\, Q(s', a') \,\right]`,
      ],
    },
    {
      num: '5 / 7',
      title: 'WE ONLY HAVE ONE SAMPLE',
      body:
        'We can\'t take an expectation — we have one trajectory. Drop the E and use the single sample:',
      latex: [
        String.raw`Q(s, a) \;\approx\; r \;+\; \gamma\, Q(s', a')`,
      ],
      foot: 'one-sample Monte Carlo estimate of the right-hand side.',
    },
    {
      num: '6 / 7',
      title: 'SUBSTITUTE THE TABLE FOR THE TRUE Q',
      body:
        'But we don\'t have <span class="sd-q">Q</span> on the right either — only our table <span class="sd-q-est">q</span>. Plug it in. The right side becomes the <b>target</b>:',
      latex: [
        String.raw`\mathtt{target} \;:=\; r \;+\; \gamma\, \mathtt{q}[s', a']`,
        String.raw`\mathtt{q}[s, a] \;\stackrel{\text{want}}{=}\; \mathtt{target}`,
      ],
    },
    {
      num: '7 / 7',
      title: 'ROBBINS-MONRO  →  THE SARSA UPDATE',
      body:
        'Don\'t overwrite — nudge <span class="sd-q-est">q[s, a]</span> toward the target by a small step <span class="sd-alpha">α</span>.',
      latex: [
        String.raw`\boxed{\;\mathtt{q}[s, a] \;\leftarrow\; \mathtt{q}[s, a] \;+\; \alpha \cdot \bigl(\, \mathtt{target} \;-\; \mathtt{q}[s, a] \,\bigr)\;}`,
      ],
      foot: 'TD error = target − current estimate. Move part-way toward where SARSA\'s sample says we should be.',
    },
  ];

  window.scenes.sceneSarsaDerive = function (root) {
    root.classList.add('scene-pad', 'sd-scene');
    root.innerHTML = '';

    /* Heading */
    const heading = document.createElement('h2');
    heading.className = 'concept-heading';
    heading.textContent = 'DERIVING SARSA';
    root.appendChild(heading);

    /* Legend: capital Q vs typewriter q. */
    const legend = document.createElement('div');
    legend.className = 'sd-legend';
    legend.innerHTML =
      '<span class="sd-legend-chip q">Q(s, a)</span><span>true (unknown) action-value function</span>' +
      '<span class="sd-legend-chip q-est">q[s, a]</span><span>our table estimate — typewriter q</span>';
    root.appendChild(legend);

    /* Controls + status */
    const ctrls = document.createElement('div');
    ctrls.className = 'sd-controls';
    ctrls.innerHTML =
      '<button class="poke-btn" id="sd-step">▶ STEP</button>' +
      '<button class="poke-btn" id="sd-reveal">REVEAL ALL</button>' +
      '<button class="poke-btn" id="sd-reset">RESET</button>' +
      '<div class="sd-status">CARD <b id="sd-card-idx">1</b> / 7</div>';
    root.appendChild(ctrls);

    /* Stack of cards */
    const stack = document.createElement('div');
    stack.className = 'sd-stack';
    root.appendChild(stack);

    const cardNodes = [];
    for (const c of CARDS) {
      const card = document.createElement('div');
      card.className = 'sd-card';
      let html =
        '<div class="sd-card-num">STEP ' + c.num + '</div>' +
        '<div class="sd-card-title">' + c.title + '</div>' +
        '<div class="sd-card-body">' + c.body + '</div>';
      card.innerHTML = html;
      /* KaTeX-render each formula into its own .sd-card-formula block. */
      if (c.latex && c.latex.length) {
        for (const f of c.latex) {
          const box = document.createElement('div');
          box.className = 'sd-card-formula';
          card.appendChild(box);
          window.Katex.render(f, box, true);
        }
      }
      if (c.foot) {
        const foot = document.createElement('div');
        foot.className = 'concept-formula-foot';
        foot.style.marginTop = '6px';
        foot.innerHTML = c.foot;
        card.appendChild(foot);
      }
      stack.appendChild(card);
      cardNodes.push(card);
    }

    /* Reveal state — `cursor` is the *highest* shown index, 0-indexed. */
    let cursor = 0;

    function applyCursor() {
      cardNodes.forEach((node, i) => {
        node.classList.toggle('shown', i <= cursor);
      });
      document.getElementById('sd-card-idx').textContent = String(cursor + 1);
    }

    function step() {
      if (cursor < CARDS.length - 1) { cursor++; applyCursor(); }
    }
    function reveal() { cursor = CARDS.length - 1; applyCursor(); }
    function reset() { cursor = 0; applyCursor(); }

    document.getElementById('sd-step').addEventListener('click', step);
    document.getElementById('sd-reveal').addEventListener('click', reveal);
    document.getElementById('sd-reset').addEventListener('click', reset);

    applyCursor();

    /* &run flag: reveal everything for headless capture. */
    const autoRun = /[#&?]run\b/.test(window.location.hash);
    if (autoRun) setTimeout(reveal, 200);

    /* &sd=N flag: jump to card N. */
    const sdMatch = (window.location.hash || '').match(/[#&?]sd=(\d+)/);
    if (sdMatch) {
      const target = Math.min(CARDS.length - 1, Math.max(0, parseInt(sdMatch[1], 10) - 1));
      setTimeout(() => { cursor = target; applyCursor(); }, 100);
    }

    return {};
  };
})();
