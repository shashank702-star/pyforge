/* ==========================================================================
   PyForge Application Core Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. STATE & STATS MANAGEMENT
  // ==========================================
  const state = {
    xp: 0,
    currentBadge: 'Novice',
    unlockedPhases: [1], // Phase 1 is unlocked initially
    currentSelectedTopic: 'intro',
    quizCurrentQuestionIndex: 0,
    quizScore: 0,
    quizAnswers: [],
    visScenario: 'vis-vars',
    visStep: 0,
    activeLessonTab: 'read', // 'read', 'slides', or 'video'
    slideIndex: 0
  };

  let pyodideInstance = null;
  const runCodeBtn = document.getElementById('run-code-btn');
  const sandboxStatusDot = document.querySelector('#sandbox-status .status-dot');
  const sandboxStatusText = document.getElementById('sandbox-status-text');

  async function initPyodide() {
    try {
      if (typeof loadPyodide === 'undefined') {
        throw new Error("WASM script not loaded from CDN.");
      }
      pyodideInstance = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
      });
      
      // Update status elements
      if (sandboxStatusDot) sandboxStatusDot.className = 'status-dot state-ready';
      if (sandboxStatusText) sandboxStatusText.textContent = 'Python 3.11 (WASM) Ready';
      if (runCodeBtn) runCodeBtn.disabled = false;
      const runDataBtn = document.getElementById('run-data-code-btn');
      if (runDataBtn) runDataBtn.disabled = false;
      logTerminal(">>> CPython 3.11 WebAssembly Core initialized. Sandbox ready.", "success");
    } catch (err) {
      console.warn("WASM Core initialization failed, using Fallback Sandbox mode: ", err);
      if (sandboxStatusDot) sandboxStatusDot.className = 'status-dot state-fallback';
      if (sandboxStatusText) sandboxStatusText.textContent = 'Python (Lite Sandbox) Active';
      if (runCodeBtn) runCodeBtn.disabled = false;
      const runDataBtn = document.getElementById('run-data-code-btn');
      if (runDataBtn) runDataBtn.disabled = false;
      logTerminal(">>> Sandbox offline. Loaded local lightweight regex interpreter fallback.", "system");
    }
  }

  // Delay initialization slightly to let DOM fully settle
  setTimeout(initPyodide, 200);

  const XP_LEVELS = {
    novice: 0,
    craftsman: 150,
    scholar: 350,
    architect: 600
  };

  function addXP(amount) {
    state.xp += amount;
    updateStatsDisplay();
  }

  function updateStatsDisplay() {
    const xpVal = document.getElementById('xp-display');
    const badgeVal = document.getElementById('badge-display');
    
    xpVal.textContent = `${state.xp} XP`;
    
    // Evaluate badge level
    let badge = 'Novice';
    if (state.xp >= XP_LEVELS.architect) {
      badge = 'Architect';
      state.unlockedPhases = [1, 2, 3, 4, 5];
    } else if (state.xp >= XP_LEVELS.scholar) {
      badge = 'Scholar';
      state.unlockedPhases = [1, 2, 3, 4];
    } else if (state.xp >= XP_LEVELS.craftsman) {
      badge = 'Craftsman';
      state.unlockedPhases = [1, 2, 3];
    }
    
    state.currentBadge = badge;
    badgeVal.textContent = badge;
    
    // Dynamically unlock Phase cards in UI
    for (let i = 1; i <= 5; i++) {
      const card = document.getElementById(`phase-${i}`);
      if (card) {
        if (state.unlockedPhases.includes(i)) {
          card.classList.add('active');
          card.querySelectorAll('.roadmap-step').forEach(step => {
            step.querySelector('.step-circle').innerHTML = i === 1 && step.dataset.topic === 'intro' ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-circle"></i>';
          });
        } else {
          card.classList.remove('active');
          card.querySelectorAll('.roadmap-step').forEach(step => {
            step.querySelector('.step-circle').innerHTML = '<i class="fa-solid fa-lock"></i>';
          });
        }
      }
    }
  }

  // ==========================================
  // 2. ROADMAP LESSONS DATA
  // ==========================================
  const lessonsData = {
    intro: {
      phase: 'Phase 1 • Spark',
      title: 'Intro & Basic Syntax',
      desc: '<p>Python is a high-level, interpreted language designed for readability. Unlike languages that use curly braces <code>{}</code> or semicolons, Python uses <strong>whitespace indentation</strong> to define structure and scope.</p><h4>Whitespace Indentation:</h4><p>Code blocks (like loops or functions) must be indented consistently, typically using 4 spaces. A mismatch in indentation will result in an <code>IndentationError</code>.</p>',
      code: '# Welcome to PyForge!\n# This is a comment\n\nmessage = "Hello Python Learner"\nprint(message)\n\nif 10 > 5:\n    print("Whitespace indentation defines scope blocks!")',
      videoId: 'Y8Tko2yc5hA'
    },
    files: {
      phase: 'Phase 1 • Spark',
      title: 'Working with Files',
      desc: '<p>File I/O (Input/Output) allows Python programs to persist data by reading and writing files. Use the built-in <code>open(filename, mode)</code> function to instantiate a file stream.</p><h4>Safe File Handles:</h4><p>Always close files after using them, or use the <code>with</code> context manager statement to guarantee resource release automatically.</p>',
      code: '# Simulating writing and reading a file\nwith open("pyforge_temp.txt", "w") as file:\n    file.write("Python File handling is simple!")\n\nwith open("pyforge_temp.txt", "r") as file:\n    print(file.read())',
      videoId: 'ixEeeNfyc70'
    },
    libraries: {
      phase: 'Phase 1 • Spark',
      title: 'Standard Libraries & Imports',
      desc: '<p>Python ships with a rich set of built-in utility modules (the Standard Library). To access these modules, use the <code>import</code> statement.</p><h4>Core Modules:</h4><p>Common built-in modules include <code>math</code> for math operations, <code>random</code> for random number generations, and <code>sys</code> or <code>os</code> for system and OS properties.</p>',
      code: 'import math\nimport random\n\nnumber = random.randint(1, 10)\nresult = math.sqrt(number)\n\nprint(f"Random Number: {number}")\nprint(f"Square Root: {result:.4f}")',
      videoId: '6u35p5zLntc'
    },
    variables: {
      phase: 'Phase 2 • Ignition',
      title: 'Variables & Reference Models',
      desc: '<p>In Python, variables are <strong>not storage boxes</strong>. They are simple <strong>labels (bindings)</strong> that point to objects on the memory heap.</p><p>When you execute <code>a = [1, 2]</code>, Python allocates the list object in the Heap space, and binds the name label <code>a</code> to it in the Stack namespace.</p><h4>Crucial Insight:</h4><p>If you set <code>b = a</code>, no copy of the list is made. Both <code>a</code> and <code>b</code> refer to the same list. Mutating one immediately affects the other.</p>',
      code: 'a = [1, 2]\nb = a\na.append(3)\nprint("a:", a)\nprint("b:", b) # b is also modified!',
      videoId: 'kqtD5dpn9C8'
    },
    structures: {
      phase: 'Phase 2 • Ignition',
      title: 'Core Data Structures',
      desc: '<p>Python features extremely versatile built-in collections: Lists (ordered, mutable), Tuples (ordered, immutable), Dictionaries (key-value hash maps), and Sets (unordered, unique values).</p><p>Understanding their mutability is key. Lists can grow/shrink, while Tuples are frozen upon creation and are frequently used to ensure data integrity.</p>',
      code: 'my_list = [10, 20]\nmy_tuple = (10, 20)\nmy_dict = {"name": "Python", "version": 3.10}\n\n# Tuples cannot be modified:\n# my_tuple[0] = 99 -> Raises TypeError!',
      videoId: 'W8KRzm-HUcc'
    },
    loops: {
      phase: 'Phase 2 • Ignition',
      title: 'Control Loops & Iterators',
      desc: '<p>Loops in Python use the Iterator Protocol under the hood. Using <code>for x in container</code> calls <code>iter(container)</code>, retrieving an iterator object, and calls <code>__next__()</code> until it raises a <code>StopIteration</code> exception.</p><h4>Range Functionality:</h4><p>The <code>range(start, stop, step)</code> function does not create a full list in memory. Instead, it generates integers on demand, making it incredibly memory efficient.</p>',
      code: 'for i in range(1, 4):\n    print(f"Forge Loop Step: {i}")',
      videoId: 'dHANJ4l6fwA'
    },
    functions: {
      phase: 'Phase 3 • Build',
      title: 'Functions & Execution Scope',
      desc: '<p>Functions are <strong>first-class citizens</strong> in Python. This means they can be passed as arguments, returned from other functions, and bound to variable names.</p><p>Python searches scopes using the <strong>LEGB Rule</strong>: <strong>L</strong>ocal -> <strong>E</strong>nclosing -> <strong>G</strong>lobal -> <strong>B</strong>uilt-in. If you want to modify a variable outside the current scope, you must explicitly declare it with <code>global</code> or <code>nonlocal</code>.</p>',
      code: 'def outer_function():\n    msg = "Enclosing Scope"\n    def inner_function():\n        nonlocal msg\n        msg = "Mutated Enclosing Scope"\n    inner_function()\n    print(msg)\nouter_function()',
      videoId: 'u-OMNv_LYRA'
    },
    comprehensions: {
      phase: 'Phase 3 • Build',
      title: 'Comprehension Syntaxes',
      desc: '<p>Comprehensions provide a concise way to create lists, dictionaries, or sets from iterable objects. They are faster than standard <code>for</code> loops because they are optimized in C-level bytecode.</p>',
      code: 'numbers = [1, 2, 3, 4, 5]\nsquares = [x**2 for x in numbers if x % 2 != 0]\nprint("Odd squares:", squares)',
      videoId: '3dt4OGnU5sM'
    },
    exceptions: {
      phase: 'Phase 3 • Build',
      title: 'Exception Propagation',
      desc: '<p>Exceptions propagate up the call stack. If they are not caught inside a <code>try/except</code> block, the execution stops, and Python prints a traceback detailing the error chain.</p>',
      code: 'def safe_divide(x, y):\n    try:\n        return x / y\n    except ZeroDivisionError:\n        return "Error: Division by zero!"\nprint(safe_divide(10, 0))',
      videoId: '6SPDvPK38es'
    },
    classes: {
      phase: 'Phase 4 • Architect',
      title: 'Classes & Instantiation',
      desc: '<p>Object-Oriented Programming (OOP) lets you bundle behavior and data together. In Python, a class defines the blueprint, and an instance represents the physical object loaded in memory.</p><p>When an instance is created, <code>__new__</code> allocates the memory, and then <code>__init__</code> initializes the attributes.</p>',
      code: 'class Wizard:\n    def __init__(self, name):\n        self.name = name\n    def cast(self):\n        return f"{self.name} casts Fireball!"\n\nmerlin = Wizard("Merlin")\nprint(merlin.cast())',
      videoId: 'wFcDGy_G6dM'
    },
    dunders: {
      phase: 'Phase 4 • Architect',
      title: 'Dunder (Magic) Methods',
      desc: '<p>Double-underscore (dunder) methods allow you to hook your classes into standard Python operations. Implementing <code>__str__</code> alters string representation, while <code>__len__</code> implements the behavior of <code>len(obj)</code>.</p>',
      code: 'class Cart:\n    def __init__(self, items):\n        self.items = items\n    def __len__(self):\n        return len(self.items)\n\nmy_cart = Cart(["book", "pen"])\nprint("Cart item count:", len(my_cart))',
      videoId: '3ohzBxoFHAY'
    },
    inheritance: {
      phase: 'Phase 4 • Architect',
      title: 'MRO & Class Inheritance',
      desc: '<p>Python supports multiple inheritance. It uses the <strong>Method Resolution Order (MRO)</strong> computed via the C3 Linearization algorithm to determine the order in which base classes are searched for attributes.</p>',
      code: 'class A: pass\nclass B(A): pass\nprint("MRO of B:", B.__mro__)',
      videoId: 'Cn7AkDb9A70'
    },
    decorators: {
      phase: 'Phase 5 • Scale',
      title: 'Decorators & Closures',
      desc: '<p>A decorator is a function that takes another function as an argument, adds some functional extension, and returns a modified function wrapper.</p><p>This relies on **Closures** - nested functions that retain reference to variable bindings from their enclosing lexical scopes even after the outer function has completed execution.</p>',
      code: 'def bold_decorator(func):\n    def wrapper():\n        return "<b>" + func() + "</b>"\n    return wrapper\n\n@bold_decorator\ndef hello():\n    return "Hello"\nprint(hello())',
      videoId: 'FsAPt_9BdxU'
    },
    generators: {
      phase: 'Phase 5 • Scale',
      title: 'Generators & Yield Statements',
      desc: '<p>Generators compile into iterator functions containing the <code>yield</code> keyword. Unlike functions that return a value and destroy their stack space, generators freeze their state and return control, resuming right where they left off when requested.</p>',
      code: 'def fibonacci(limit):\n    a, b = 0, 1\n    for _ in range(limit):\n        yield a\n        a, b = b, a + b\n\nprint(list(fibonacci(5)))',
      videoId: 'tmeK5Gef5XA'
    },
    context: {
      phase: 'Phase 5 • Scale',
      title: 'Context Managers',
      desc: '<p>Context managers streamline resource lifecycle management (like opening files or lock acquisitions). They are triggered using the <code>with</code> block, executing <code>__enter__</code> to set up resources, and <code>__exit__</code> to guarantee cleanup even if errors occur.</p>',
      code: 'class FileMock:\n    def __enter__(self):\n        print("Opening mock file...")\n        return self\n    def __exit__(self, exc_type, exc_val, exc_tb):\n        print("Closing file mock safely.")\n\nwith FileMock() as f:\n    print("Writing bytes...")',
      videoId: 'iv8mcWJG48U'
    }
  };

  // ==========================================
  // 3. PPT PRESENTATION SLIDES DATABASE
  // ==========================================
  const slidesData = {
    intro: [
      { title: "Python Readability & Zen", bullets: ["Whitespace indentation defines code block boundaries.", "Semicolons are optional and generally avoided.", "Single line comments use #; triple-quotes define docstrings."] },
      { title: "Indentation and Block Scope", bullets: ["Always use 4 spaces per indentation level.", "Never mix tabs and spaces (raises TabError).", "Blocks are introduced by colons (:) at the end of parent statements."] },
      { title: "Dynamic Typing Variables", bullets: ["Variables are name tags bound to objects on the fly.", "You don't declare variable datatypes beforehand.", "Variables can refer to different types during execution."] }
    ],
    files: [
      { title: "File Input & Output streams", bullets: ["Use open(filename, mode) to get a file object handle.", "Common access modes: 'r' (read), 'w' (write), 'a' (append).", "Always call close() to release OS locks and flush memory buffers."] },
      { title: "Context Managers and Safety", bullets: ["The 'with' statement forms a safe execution scope.", "Automatically closes file handlers even if exceptions occur.", "Avoids common resource leaks in production script loops."] }
    ],
    libraries: [
      { title: "The Python Standard Library", bullets: ["Python's 'batteries included' policy provides built-in modules.", "Import modules using: import module_name.", "Access elements using dot notation: math.sqrt(16)."] },
      { title: "Core Modules Overview", bullets: ["math: core constants (pi) and functions (log, sin, sqrt).", "random: generate pseudo-random floats, integers, and choices.", "os & sys: query environment variables and runtime settings."] }
    ],
    variables: [
      { title: "Variables as Namespaces Pointers", bullets: ["Variables in Python are labels, NOT boxes containing values.", "An assignment binds a namespace key to an allocated Heap reference ID.", "Passing parameters passes references, not copies of variables."] },
      { title: "Stack Frame vs Heap allocation", bullets: ["Stack isolates name labels, active parameters, and scope frame references.", "Heap contains data payloads: Integers, lists, objects, and strings.", "Variables act as 32/64-bit address labels pointing to Heap addresses."] },
      { title: "Shared Bindings & Mutation Pitfalls", bullets: ["Assigning 'b = a' makes both stack names hold the SAME heap reference.", "If you alter a mutable object via label 'a', label 'b' reflects it too.", "To clone collections, use explicit '.copy()' or deepcopy methods."] }
    ],
    structures: [
      { title: "Core Python Collections", bullets: ["Lists: Ordered, dynamic size arrays. Perfect for stack/queue pipelines.", "Tuples: Immutable arrays. Faster retrieval speeds than mutable lists.", "Dicts: High-performance Hash tables mapping unique keys to values.", "Sets: Hash-bound unique objects. Provides O(1) set operation speeds."] },
      { title: "Scoping Mutability Rules", bullets: ["Mutable containers (List, Dict, Set) can alter their internal structures.", "Immutable values (Int, Float, String, Tuple) cannot alter values after init.", "Mutables cannot be dictionary keys because key elements must be hashable."] }
    ],
    loops: [
      { title: "Python Iterator Protocol", bullets: ["Loops call 'iter(container)', resolving an internal iterator object.", "Iteration repeats '__next__()' calls, returning elements one-by-one.", "Loops exit when the iterator raises a 'StopIteration' signal."] },
      { title: "Memory Optimizing with Ranges", bullets: ["'range()' is a generator-like sequence class that computes integers on-demand.", "Running 'range(10000)' consumes the same memory as 'range(5)'.", "Avoid converting ranges to lists via 'list(range())' to prevent memory bloat."] }
    ],
    functions: [
      { title: "Functions as First-Class Entities", bullets: ["Functions are objects. They can be assigned, passed, and returned.", "Lexical scopes are bound when functions are declared, not when executed.", "Every execution builds a local namespace scope frame on the stack."] },
      { title: "LEGB Namespace Resolution", bullets: ["Variable searches check: Local -> Enclosing -> Global -> Built-in.", "Python looks up variables sequentially, throwing NameError if not found.", "Use 'global' or 'nonlocal' keywords to rebind outside variables."] }
    ],
    comprehensions: [
      { title: "Bytecode Optimized Collections", bullets: ["Comprehensions construct Lists/Dicts/Sets using inline loop syntax.", "Executed inside C-level bytecode, compiling faster than manual loops.", "Syntactic sugar replacing: results = []; for x in data: results.append(x)."] },
      { title: "Comprehension Syntax Guidelines", bullets: ["Keep logic readable: '[x**2 for x in data if x % 2 == 0]'.", "Do not nest comprehensions deeper than 2 layers to preserve readability.", "Use generator expressions '(x**2 for x in data)' for lazy allocation."] }
    ],
    exceptions: [
      { title: "Tracebacks and Scoping", bullets: ["Errors instantiate Exception classes and propagate up stack frames.", "If uncaught, runtime terminates and dumps the Traceback log.", "Exceptions are caught using 'try/except/finally' statement logic."] },
      { title: "Propagation Best Practices", bullets: ["Never write blank check 'except: pass' to prevent swallowing core errors.", "Catch specific failures: catch 'KeyError' or 'ValueError' explicitly.", "Use 'finally' blocks to close system file handlers and sockets."] }
    ],
    classes: [
      { title: "OOP Blueprinting & Allocation", bullets: ["Classes act as namespaces defining methods and initial property shapes.", "Instantiation runs '__new__' to allocate heap space, returning the object.", "The '__init__' method receives the empty instance as 'self' to bind state."] },
      { title: "Attribute Directory Namespace", bullets: ["Instances save unique properties inside a namespace directory '__dict__'.", "Python checks Instance dictionary first, then search resolves to Class dict.", "Methods are simple class functions bound to instances on invocation."] }
    ],
    dunders: [
      { title: "Double-Underscore Magic Hooks", bullets: ["Dunder methods allow classes to hook into Python's built-in operators.", "Overload string conversion via '__str__' (user) or '__repr__' (dev).", "Hook calculations by implementing math operations like '__add__'."] },
      { title: "Emulating Native Behaviors", bullets: ["Implement '__len__(self)' to hook custom containers into global 'len()'.", "Define '__getitem__(self, key)' to enable index bracket lookups: obj[0].", "Write '__iter__' and '__next__' to build customized iterator containers."] }
    ],
    inheritance: [
      { title: "Method Resolution Order (MRO)", bullets: ["Python supports multiple inheritance, merging parent classes together.", "Attributes lookup uses C3 Linearization to compute MRO sequences.", "Inspect lookup priority for any class using the 'Class.__mro__' method."] },
      { title: "Dynamic Super Class Calling", bullets: ["Use 'super()' to dynamically invoke methods inside parent hierarchies.", "Ensures every base parent is resolved exactly once in diamonds structures.", "Avoid hardcoding direct class name calls: 'ParentClass.method(self)'."] }
    ],
    decorators: [
      { title: "Closures & Functional Wrappers", bullets: ["Closures are functions remembering lexical values after parent returns.", "A decorator function wraps another function, returning a modified closure.", "Syntactic sugar replacing: 'original_func = decorator(original_func)'."] },
      { title: "Decorator Pipeline Syntax", bullets: ["Decorate methods using '@decorator_name' tags before declarations.", "Wrapper methods use '*args, **kwargs' to forward parameters dynamically.", "Leverage 'functools.wraps' inside wrappers to preserve function docstrings."] }
    ],
    generators: [
      { title: "Lazy Iterators & Generator States", bullets: ["Generators are built using 'yield' statements instead of 'return'.", "Calling generator functions returns generator iterators without running code.", "Each item retrieval runs logic up to the next encountered 'yield'."] },
      { title: "State Freezing Mechanisms", bullets: ["Yielding freezes local scope frame states, retaining variables.", "Memory footprint remains O(1) regardless of sequence lengths.", "Use generator expressions for simple pipelines: '(x*2 for x in data)'."] }
    ],
    context: [
      { title: "Resource Safekeeping Protocols", bullets: ["Context Managers govern clean entry/exit routines for system tasks.", "Triggered using 'with' statements, ensuring deterministic cleanups.", "Standard uses: File open/closing, locks, DB connection channels."] },
      { title: "The Context Manager Lifecycle", bullets: ["Entering 'with' triggers '__enter__()', binding returned items.", "Exiting triggers '__exit__(exc_type, exc_val, exc_tb)'.", "Guarantees resource release even if runtime errors occur in the block."] }
    ]
  };


  const lessonPanel = document.getElementById('lesson-panel');
  const lessonPhaseInd = document.getElementById('lesson-phase-indicator');
  const lessonTitle = document.getElementById('lesson-title');
  const lessonText = document.getElementById('lesson-text');
  const lessonCodeContent = document.getElementById('lesson-code-content');
  const tutorialVideoIframe = document.getElementById('tutorial-video-iframe');

  // Slide viewer HTML nodes
  const slideIndicator = document.getElementById('slide-indicator');
  const slideTitle = document.getElementById('slide-title');
  const slideBullets = document.getElementById('slide-bullets');
  const slideProgressFill = document.getElementById('slide-progress-fill');
  const slidePrevBtn = document.getElementById('slide-prev-btn');
  const slideNextBtn = document.getElementById('slide-next-btn');

  // Wire roadmap steps click
  document.querySelectorAll('.roadmap-step').forEach(step => {
    step.addEventListener('click', (e) => {
      const phaseCard = step.closest('.phase-card');
      const phaseNum = parseInt(phaseCard.id.split('-')[1]);
      
      if (!state.unlockedPhases.includes(phaseNum)) {
        alert("This learning phase is currently locked. Gain more XP by completing tasks and taking the Quiz to unlock!");
        return;
      }

      document.querySelectorAll('.roadmap-step').forEach(s => s.classList.remove('active'));
      step.classList.add('active');

      const topic = step.dataset.topic;
      state.currentSelectedTopic = topic;
      loadLesson(topic);
    });
  });

  function loadLesson(topic) {
    const data = lessonsData[topic];
    if (!data) return;

    lessonPhaseInd.textContent = data.phase;
    lessonTitle.textContent = data.title;
    lessonText.innerHTML = data.desc;
    lessonCodeContent.textContent = data.code;

    // Load video frame source
    if (data.videoId) {
      tutorialVideoIframe.src = `https://www.youtube.com/embed/${data.videoId}?rel=0`;
    } else {
      tutorialVideoIframe.src = '';
    }

    // Reset slide deck index
    state.slideIndex = 0;
    renderSlidesViewer();

    // Default back to 'read' tab
    switchTab('read');

    // Update download note links dynamically
    const downloadNotesBtn = document.getElementById('download-notes-btn');
    if (downloadNotesBtn) {
      downloadNotesBtn.href = `notes/${topic}_notes.md`;
    }

    // Display panel
    lessonPanel.style.display = 'block';
    lessonPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    addXP(15);
  }

  // Tutorial tab switching
  const tabBtnRead = document.getElementById('tab-btn-read');
  const tabBtnSlides = document.getElementById('tab-btn-slides');
  const tabBtnVideo = document.getElementById('tab-btn-video');
  const tabContentRead = document.getElementById('tab-content-read');
  const tabContentSlides = document.getElementById('tab-content-slides');
  const tabContentVideo = document.getElementById('tab-content-video');

  tabBtnRead.addEventListener('click', () => switchTab('read'));
  tabBtnSlides.addEventListener('click', () => switchTab('slides'));
  tabBtnVideo.addEventListener('click', () => switchTab('video'));

  function switchTab(tab) {
    state.activeLessonTab = tab;
    
    // De-activate all tabs and hide panels
    tabBtnRead.classList.remove('active');
    tabBtnSlides.classList.remove('active');
    tabBtnVideo.classList.remove('active');
    
    tabContentRead.classList.add('hidden');
    tabContentRead.classList.remove('active');
    tabContentSlides.classList.add('hidden');
    tabContentSlides.classList.remove('active');
    tabContentVideo.classList.add('hidden');
    tabContentVideo.classList.remove('active');

    if (tab === 'read') {
      tabBtnRead.classList.add('active');
      tabContentRead.classList.remove('hidden');
      tabContentRead.classList.add('active');
    } else if (tab === 'slides') {
      tabBtnSlides.classList.add('active');
      tabContentSlides.classList.remove('hidden');
      tabContentSlides.classList.add('active');
      renderSlidesViewer();
      addXP(5); // slide view reward
    } else {
      tabBtnVideo.classList.add('active');
      tabContentVideo.classList.remove('hidden');
      tabContentVideo.classList.add('active');
      addXP(5); // video view reward
    }
  }

  // Render slides viewer content
  function renderSlidesViewer() {
    const topic = state.currentSelectedTopic;
    const slides = slidesData[topic];
    if (!slides) return;

    const currentSlide = slides[state.slideIndex];
    slideIndicator.textContent = `Slide ${state.slideIndex + 1} of ${slides.length}`;
    slideTitle.textContent = currentSlide.title;
    
    // Render bullet points
    slideBullets.innerHTML = '';
    currentSlide.bullets.forEach(bullet => {
      const li = document.createElement('li');
      li.textContent = bullet;
      slideBullets.appendChild(li);
    });

    // Render progress bar
    const percentage = ((state.slideIndex + 1) / slides.length) * 100;
    slideProgressFill.style.width = `${percentage}%`;

    // Disable buttons accordingly
    slidePrevBtn.disabled = state.slideIndex === 0;
    slideNextBtn.disabled = state.slideIndex === slides.length - 1;
  }

  slidePrevBtn.addEventListener('click', () => {
    if (state.slideIndex > 0) {
      state.slideIndex--;
      renderSlidesViewer();
    }
  });

  slideNextBtn.addEventListener('click', () => {
    const slides = slidesData[state.currentSelectedTopic];
    if (slides && state.slideIndex < slides.length - 1) {
      state.slideIndex++;
      renderSlidesViewer();
    }
  });

  // Wire Save Notes as PDF Print Action
  const printNotesBtn = document.getElementById('print-notes-btn');
  if (printNotesBtn) {
    printNotesBtn.addEventListener('click', () => {
      // Force switch to reading tab first so it renders in the print preview
      switchTab('read');
      setTimeout(() => {
        window.print();
      }, 250);
    });
  }

  // Close lesson panel button
  document.getElementById('close-lesson-btn').addEventListener('click', () => {
    lessonPanel.style.display = 'none';
    tutorialVideoIframe.src = '';
  });

  // Copy Snippet
  document.getElementById('copy-snippet-btn').addEventListener('click', () => {
    const code = lessonCodeContent.textContent;
    navigator.clipboard.writeText(code).then(() => {
      const copyBtn = document.getElementById('copy-snippet-btn');
      copyBtn.innerHTML = '<i class="fa-solid fa-check text-mint"></i> Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
      }, 2000);
    });
  });

  // Load into Playground
  document.getElementById('load-to-playground-btn').addEventListener('click', () => {
    const code = lessonCodeContent.textContent;
    const playgroundTextArea = document.getElementById('code-textarea');
    playgroundTextArea.value = code;
    
    updateLineNumbers(code);

    const playgroundSec = document.getElementById('playground');
    playgroundSec.scrollIntoView({ behavior: 'smooth' });
    
    clearTerminal();
    logTerminal(`>>> Loaded lesson snippet "${lessonsData[state.currentSelectedTopic].title}" into editor.`, 'system');
  });


  // ==========================================
  // 7. CURATED VIDEO LIBRARY CATALOG
  // ==========================================
  const videoCatalogData = [
    { id: "Y8Tko2yc5hA", phase: "spark", title: "Intro & Basic Syntax", desc: "Understand whitespace indentation, comments, printing, and code structure.", duration: "10:30" },
    { id: "ixEeeNfyc70", phase: "spark", title: "Python File Handling I/O", desc: "Learn to read/write text files, append content, and use context managers.", duration: "14:15" },
    { id: "6u35p5zLntc", phase: "spark", title: "Standard Libraries & Imports", desc: "How to use math, random, sys, and os libraries to enhance functionality.", duration: "12:50" },
    { id: "kqtD5dpn9C8", phase: "ignition", title: "Variables & Reference Models", desc: "A detailed breakdown of variable bindings, tags, stack bindings, and mutability.", duration: "12:15" },
    { id: "W8KRzm-HUcc", phase: "ignition", title: "Mastering Lists, Tuples & Dicts", desc: "Explore collections scoping, hash mapping, lists, sets, and tuple safety.", duration: "18:40" },
    { id: "dHANJ4l6fwA", phase: "ignition", title: "Control Flows & Loops", desc: "How python iterators trigger list loops and evaluate conditions.", duration: "14:20" },
    { id: "u-OMNv_LYRA", phase: "build", title: "Function Scoping & LEGB Rules", desc: "A clean walkthrough of enclosing ranges, namespace priorities, and nonlocals.", duration: "16:05" },
    { id: "3dt4OGnU5sM", phase: "build", title: "List Comprehensions Optimization", desc: "Making your codes faster using inline collections declaration and filtering.", duration: "11:55" },
    { id: "wFcDGy_G6dM", phase: "architect", title: "Classes & Instance Heap Space", desc: "Learn class constructor properties, attribute lookups, and heap layout.", duration: "25:30" },
    { id: "3ohzBxoFHAY", phase: "architect", title: "Magic (Dunder) Methods", desc: "Hook your custom classes into len(), str() and arithmetic operator overloading.", duration: "15:10" },
    { id: "FsAPt_9BdxU", phase: "scale", title: "Decorators & Closures", desc: "Deep dive into wrapper structures, functional decorators, and scopes.", duration: "22:45" },
    { id: "tmeK5Gef5XA", phase: "scale", title: "Generators & Yield Statements", desc: "How generator functions freeze local scopes to loop data efficiently.", duration: "19:10" }
  ];

  const videoGrid = document.getElementById('video-grid');

  function renderVideoCatalog(filterPhase = 'all') {
    videoGrid.innerHTML = '';
    const filtered = filterPhase === 'all' 
      ? videoCatalogData 
      : videoCatalogData.filter(v => v.phase === filterPhase);

    filtered.forEach(video => {
      const card = document.createElement('div');
      card.className = 'video-card';
      
      card.innerHTML = `
        <div class="video-thumbnail-container" data-videoid="${video.id}">
          <img src="https://img.youtube.com/vi/${video.id}/hqdefault.jpg" alt="${video.title} Cover">
          <div class="video-play-overlay"><i class="fa-solid fa-circle-play"></i></div>
        </div>
        <div class="video-card-body">
          <div class="video-meta-tags">
            <span>Phase: ${video.phase}</span>
            <span class="video-duration"><i class="fa-regular fa-clock"></i> ${video.duration}</span>
          </div>
          <h4 class="video-card-title">${video.title}</h4>
          <p class="video-card-desc">${video.desc}</p>
        </div>
      `;

      card.querySelector('.video-thumbnail-container').addEventListener('click', (e) => {
        const container = e.currentTarget;
        const videoId = container.dataset.videoid;
        container.innerHTML = `
          <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        `;
        addXP(10);
      });

      videoGrid.appendChild(card);
    });
  }

  document.querySelectorAll('.video-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.video-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderVideoCatalog(btn.dataset.filter);
    });
  });

  renderVideoCatalog();


  // ==========================================
  // 8. THE INTERACTIVE PLAYGROUND (MOCK PARSER)
  // ==========================================
  const templates = {
    intro: `# Basic Python syntax\nname = "PyForge Learner"\nprint(f"Hello, {name}!")\n\nif 10 > 5:\n    print("Indentations define blocks!")`,
    files: `# File operations simulated\nwith open("sandbox.txt", "w") as f:\n    f.write("Created in the PyForge WASM Sandbox!")\n\nwith open("sandbox.txt", "r") as f:\n    print(f.read())`,
    libraries: `import math\nimport random\n\nval = random.randint(10, 100)\nprint(f"Random number is: {val}")\nprint(f"Its square root is: {math.sqrt(val):.2f}")`,
    vars: `x = 42\ny = x\nx = 99\n\nprint("x is:", x)\nprint("y is:", y)`,
    comprehension: `nums = [1, 2, 3, 4, 5]\nevens_squared = [x**2 for x in nums if x % 2 == 0]\n\nprint("Evens squared list:", evens_squared)`,
    'class-oop': `class ForgeMember:\n    def __init__(self, name, xp):\n        self.name = name\n        self.xp = xp\n    def get_info(self):\n        return f"Member {self.name} has {self.xp} XP!"\n\nmember = ForgeMember("Archimedes", 250)\nprint(member.get_info())`,
    'decorator-timer': `def py_forge_decorator(func):\n    def wrapper():\n        print("[Decorator] Intercepting execution...")\n        func()\n        print("[Decorator] Execution completed.")\n    return wrapper\n\n@py_forge_decorator\ndef launch():\n    print("Executing core function launch.")\n\nlaunch()`,
    'json-parser': `import json\n\n# Real scenario: Parsing JSON data response\nraw_json = '{"user": "Alice", "role": "admin", "permissions": ["read", "write"]}'\ndata = json.loads(raw_json)\n\nprint(f"User: {data.get('user')}")\nprint(f"Is Admin: {data.get('role') == 'admin'}")\nprint(f"Permissions: {', '.join(data.get('permissions', []))}")`,
    'log-parser': `# Real scenario: Extracting information from server logs\nlogs = """\n2026-06-07 10:00:01 INFO Connection established.\\n2026-06-07 10:05:23 WARNING High memory consumption.\\n2026-06-07 10:06:12 ERROR Database connection timed out.\\n2026-06-07 10:09:12 ERROR Authentication failed.\\n"""\n\nprint("--- Extracted Errors ---")\nfor line in logs.strip().split('\\\\n'):\n    if "ERROR" in line:\n        parts = line.split(" ERROR ")\n        print(f"[CRITICAL ALERT] Time: {parts[0].strip()} | Message: {parts[1].strip()}")`,
    'data-pipeline': `# Real scenario: Aggregating sales metrics data\ntransactions = [\n    {"item": "Keyboard", "price": 85.00, "category": "Electronics"},\n    {"item": "Notebook", "price": 4.50, "category": "Stationery"},\n    {"item": "Monitor", "price": 250.00, "category": "Electronics"},\n    {"item": "Pen Pack", "price": 8.00, "category": "Stationery"},\n    {"item": "Mouse", "price": 45.00, "category": "Electronics"}\n]\n\nelectronics = [t for t in transactions if t["category"] == "Electronics"]\nprices = [t["price"] for t in electronics]\ntotal_sales = sum(prices)\n\nprint(f"Electronics items found: {len(electronics)}")\nprint(f"Total Electronics sales value: \${total_sales:.2f}")\nprint(f"Average Electronics price: \${total_sales / len(prices):.2f}")`,
    memoize: `import time\n\n# Real scenario: Memoization caching decorator\ndef memoize(func):\n    cache = {}\n    def wrapper(n):\n        if n not in cache:\n            cache[n] = func(n)\n        return cache[n]\n    return wrapper\n\n@memoize\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nstart = time.perf_counter()\nres = fibonacci(32)\nend = time.perf_counter()\n\nprint(f"Fibonacci(32) = {res}")\nprint(f"Time Taken: {(end - start) * 1000:.3f} ms")`
  };

  const codeTextarea = document.getElementById('code-textarea');
  const lineNumbers = document.getElementById('line-numbers');
  const scenarioSelect = document.getElementById('scenario-select');
  const terminalBody = document.getElementById('terminal-body');

  codeTextarea.addEventListener('input', () => {
    updateLineNumbers(codeTextarea.value);
  });

  function updateLineNumbers(text) {
    const linesCount = text.split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= Math.max(linesCount, 10); i++) {
      numbersHtml += `<span>${i}</span>`;
    }
    lineNumbers.innerHTML = numbersHtml;
  }

  scenarioSelect.addEventListener('change', () => {
    const val = scenarioSelect.value;
    if (val !== 'custom' && templates[val]) {
      codeTextarea.value = templates[val];
      updateLineNumbers(templates[val]);
      clearTerminal();
      logTerminal(`>>> Template "${val}" loaded. Click 'Run Code' to execute.`, 'system');
    }
  });

  document.getElementById('run-code-btn').addEventListener('click', () => {
    executePythonCode(codeTextarea.value);
  });

  document.getElementById('reset-code-btn').addEventListener('click', () => {
    const val = scenarioSelect.value;
    if (val !== 'custom' && templates[val]) {
      codeTextarea.value = templates[val];
    } else {
      codeTextarea.value = '';
    }
    updateLineNumbers(codeTextarea.value);
    clearTerminal();
    logTerminal(`>>> Editor reset.`, 'system');
  });

  document.getElementById('clear-terminal-btn').addEventListener('click', clearTerminal);

  function clearTerminal() {
    terminalBody.innerHTML = '';
  }

  function logTerminal(message, type = 'val') {
    const line = document.createElement('div');
    line.className = `terminal-output-line output-${type}`;
    line.textContent = message;
    terminalBody.appendChild(line);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  async function executePythonCode(code) {
    clearTerminal();
    logTerminal('>>> Running script.py...', 'system');

    if (pyodideInstance) {
      try {
        // Prepare stdout/stderr capture in Pyodide
        await pyodideInstance.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
        `);

        // Execute user python script
        await pyodideInstance.runPythonAsync(code);

        const stdout = pyodideInstance.runPython("sys.stdout.getvalue()");
        const stderr = pyodideInstance.runPython("sys.stderr.getvalue()");

        if (stdout) {
          logTerminal(stdout, 'val');
        }
        if (stderr) {
          logTerminal(stderr, 'err');
        }

        if (!stdout && !stderr) {
          logTerminal("(No stdout printed. Script returned with 0 output statements)", 'val');
        } else if (!stderr) {
          logTerminal('\nExecution completed successfully.', 'success');
          addXP(25);
        }
      } catch (err) {
        logTerminal(err.message, 'err');
      }
    } else {
      executePythonCodeFallback(code);
    }
  }

  function executePythonCodeFallback(code) {
    const lines = code.split('\n');
    let variables = {};
    let outputLines = [];
    let hasErrors = false;

    function evalExpression(expr, vars) {
      let cleaned = expr.trim();
      
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        const compRegex = /\[\s*(.+?)\s+for\s+(.+?)\s+in\s+(.+?)(?:\s+if\s+(.+?))?\s*\]/;
        const match = cleaned.match(compRegex);
        if (match) {
          const actionExpr = match[1];
          const varName = match[2];
          const iterableName = match[3];
          const filterExpr = match[4];
          
          const iterable = vars[iterableName.trim()] || eval(iterableName.trim());
          if (Array.isArray(iterable)) {
            let resultList = [];
            for (let item of iterable) {
              let localVars = { ...vars, [varName.trim()]: item };
              let passes = true;
              if (filterExpr) {
                let jsFilter = filterExpr.replace(/%/g, '%')
                                         .replace(/==/g, '===')
                                         .replace(/and/g, '&&')
                                         .replace(/or/g, '||')
                                         .replace(/not/g, '!');
                passes = runJsEval(jsFilter, localVars);
              }
              if (passes) {
                let jsAction = actionExpr.replace(/\*\*/g, '**');
                resultList.push(runJsEval(jsAction, localVars));
              }
            }
            return resultList;
          }
        }
      }

      let jsExpr = cleaned.replace(/\*\*/g, '**')
                           .replace(/and/g, '&&')
                           .replace(/or/g, '||')
                           .replace(/not/g, '!')
                           .replace(/None/g, 'null')
                           .replace(/True/g, 'true')
                           .replace(/False/g, 'false');

      const keys = Object.keys(vars).sort((a,b) => b.length - a.length);
      for (let key of keys) {
        const val = vars[key];
        const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        jsExpr = jsExpr.replace(regex, valStr);
      }

      try {
        if (jsExpr.startsWith('f"') || jsExpr.startsWith("f'")) {
          let innerStr = jsExpr.substring(2, jsExpr.length - 1);
          innerStr = innerStr.replace(/\{(.+?)\}/g, (match, expression) => {
            return eval(expression);
          });
          return innerStr;
        }

        return eval(jsExpr);
      } catch (e) {
        throw new Error(`Failed to evaluate expression: ${expr}`);
      }
    }

    function runJsEval(expr, vars) {
      let jsExpr = expr;
      for (let key in vars) {
        const val = vars[key];
        const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        jsExpr = jsExpr.replace(regex, valStr);
      }
      return eval(jsExpr);
    }

    try {
      let inClass = false;
      let currentClassName = "";
      let classMethods = {};

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();

        if (line === '' || line.startsWith('#')) {
          continue;
        }

        if (line.startsWith('class ')) {
          inClass = true;
          currentClassName = line.replace('class ', '').replace(':', '').trim();
          classMethods[currentClassName] = {};
          continue;
        }

        if (inClass && rawLine.startsWith('    ')) {
          if (line.startsWith('def ')) {
            const methodHead = line.replace('def ', '').replace(':', '').trim();
            if (methodHead.startsWith('__init__')) {
              const argsMatch = methodHead.match(/\((.+?)\)/);
              const args = argsMatch ? argsMatch[1].split(',').map(s => s.trim()) : [];
              classMethods[currentClassName]['__init__'] = {
                args: args,
                body: []
              };
              let j = i + 1;
              while (j < lines.length && (lines[j].startsWith('        ') || lines[j].trim() === '')) {
                if (lines[j].trim() !== '') {
                  classMethods[currentClassName]['__init__'].body.push(lines[j].trim());
                }
                j++;
              }
              i = j - 1;
            } else {
              const methodName = methodHead.split('(')[0];
              const argsMatch = methodHead.match(/\((.+?)\)/);
              const args = argsMatch ? argsMatch[1].split(',').map(s => s.trim()) : [];
              classMethods[currentClassName][methodName] = {
                args: args,
                body: []
              };
              let j = i + 1;
              while (j < lines.length && (lines[j].startsWith('        ') || lines[j].trim() === '')) {
                if (lines[j].trim() !== '') {
                  classMethods[currentClassName][methodName].body.push(lines[j].trim());
                }
                j++;
              }
              i = j - 1;
            }
          }
          continue;
        } else if (inClass && !rawLine.startsWith('    ') && line !== '') {
          inClass = false;
        }

        // Print statement parsing
        if (line.startsWith('print(') && line.endsWith(')')) {
          const content = line.substring(6, line.length - 1);
          
          let params = [content];
          if (content.includes(',') && !content.startsWith('[') && !content.includes('f"')) {
            params = content.split(',').map(p => p.trim());
          }

          let logVal = "";
          for (let param of params) {
            if ((param.startsWith('"') && param.endsWith('"')) || (param.startsWith("'") && param.endsWith("'"))) {
              logVal += param.substring(1, param.length - 1) + " ";
            } else {
              const res = evalExpression(param, variables);
              if (Array.isArray(res)) {
                logVal += "[" + res.join(', ') + "] ";
              } else {
                logVal += String(res) + " ";
              }
            }
          }
          outputLines.push(logVal.trim());
          continue;
        }

        // Mock class instantiation
        const classInstMatch = line.match(/^([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)\((.+?)\)$/);
        if (classInstMatch) {
          const varName = classInstMatch[1];
          const className = classInstMatch[2];
          const rawArgs = classInstMatch[3].split(',').map(a => a.trim());

          if (classMethods[className]) {
            const initMethod = classMethods[className]['__init__'];
            let instanceObj = { __class__: className };
            
            if (initMethod) {
              const argNames = initMethod.args;
              for (let k = 1; k < argNames.length; k++) {
                const argVal = evalExpression(rawArgs[k-1], variables);
                instanceObj[argNames[k]] = argVal;
              }
              for (let cmd of initMethod.body) {
                const assignMatch = cmd.match(/^self\.([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
                if (assignMatch) {
                  const attrName = assignMatch[1];
                  const attrExpr = assignMatch[2];
                  let localVars = {};
                  for (let k = 1; k < argNames.length; k++) {
                    localVars[argNames[k]] = instanceObj[argNames[k]];
                  }
                  instanceObj[attrName] = evalExpression(attrExpr, { ...variables, ...localVars });
                }
              }
            }
            variables[varName] = instanceObj;
            continue;
          }
        }

        // Class instance method call outputting
        if (line.startsWith('print(') && line.includes('.')) {
          const printInner = line.substring(6, line.length - 1);
          const methodCallMatch = printInner.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\(\)$/);
          if (methodCallMatch) {
            const instanceName = methodCallMatch[1];
            const methodName = methodCallMatch[2];
            
            const instance = variables[instanceName];
            if (instance && instance.__class__) {
              const className = instance.__class__;
              const method = classMethods[className][methodName];
              if (method) {
                for (let cmd of method.body) {
                  if (cmd.startsWith('return ')) {
                    const retExpr = cmd.substring(7);
                    let jsExpr = retExpr;
                    for (let key in instance) {
                      if (key !== '__class__') {
                        const regex = new RegExp(`self\\.${key}`, 'g');
                        const attrVal = typeof instance[key] === 'string' ? `"${instance[key]}"` : instance[key];
                        jsExpr = jsExpr.replace(regex, attrVal);
                      }
                    }
                    const res = evalExpression(jsExpr, variables);
                    outputLines.push(res);
                  }
                }
                continue;
              }
            }
          }
        }

        // Mock decorators and execution triggers
        if (line === 'launch()') {
          if (code.includes('py_forge_decorator')) {
            outputLines.push('[Decorator] Intercepting execution...');
            outputLines.push('Executing core function launch.');
            outputLines.push('[Decorator] Execution completed.');
            continue;
          }
        }

        // List append parsing
        const appendMatch = line.match(/^([a-zA-Z0-9_]+)\.append\((.+?)\)$/);
        if (appendMatch) {
          const varName = appendMatch[1];
          const valExpr = appendMatch[2];
          if (variables[varName] && Array.isArray(variables[varName])) {
            const val = evalExpression(valExpr, variables);
            variables[varName].push(val);
            continue;
          }
        }

        // Standard variable assignments
        const assignMatch = line.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
        if (assignMatch) {
          const varName = assignMatch[1];
          const valExpr = assignMatch[2];
          variables[varName] = evalExpression(valExpr, variables);
          continue;
        }
      }

      if (outputLines.length > 0) {
        outputLines.forEach(l => logTerminal(l, 'val'));
      } else {
        logTerminal('(No stdout printed. Script returned with 0 output statements)', 'val');
      }
      logTerminal('\nExecution completed successfully.', 'success');
      addXP(25);

    } catch (err) {
      logTerminal(`Traceback (most recent call last):\n  File "script.py", line undefined, in <module>\nTypeError / NameError: ${err.message}`, 'err');
    }
  }


  // ==========================================
  // 9. MEMORY REFERENCE VISUALIZER
  // ==========================================
  const visualizerScenarios = {
    'vis-vars': [
      {
        code: `<div class="vis-line active"># Step 1: Initialize list</div>
<div class="vis-line">a = [10, 20]</div>
<div class="vis-line">b = a</div>
<div class="vis-line">a.append(30)</div>`,
        stack: [
          { name: 'a', ref: '#2490' }
        ],
        heap: [
          { ref: '#2490', val: '[10, 20]', type: 'List' }
        ],
        desc: 'Python allocates the list object `[10, 20]` at memory address `#2490`. The variable name `a` is bound to it.'
      },
      {
        code: `<div class="vis-line"># Step 2: Shared reference</div>
<div class="vis-line">a = [10, 20]</div>
<div class="vis-line active">b = a</div>
<div class="vis-line">a.append(30)</div>`,
        stack: [
          { name: 'a', ref: '#2490' },
          { name: 'b', ref: '#2490' }
        ],
        heap: [
          { ref: '#2490', val: '[10, 20]', type: 'List' }
        ],
        desc: '`b = a` does NOT duplicate the data. Variable label `b` is assigned to point to the same memory reference `#2490`.'
      },
      {
        code: `<div class="vis-line"># Step 3: Shared mutation outcome</div>
<div class="vis-line">a = [10, 20]</div>
<div class="vis-line">b = a</div>
<div class="vis-line active">a.append(30)</div>`,
        stack: [
          { name: 'a', ref: '#2490' },
          { name: 'b', ref: '#2490' }
        ],
        heap: [
          { ref: '#2490', val: '[10, 20, 30]', type: 'List' }
        ],
        desc: '`a.append(30)` alters the shared list object directly. Since `b` references the exact same ID, printing `b` yields `[10, 20, 30]` too!'
      }
    ],
    'vis-mut': [
      {
        code: `<div class="vis-line active">x = 100</div>
<div class="vis-line">y = x</div>
<div class="vis-line">x = 200</div>`,
        stack: [
          { name: 'x', ref: '#1001' }
        ],
        heap: [
          { ref: '#1001', val: '100', type: 'Int' }
        ],
        desc: 'Integer values are immutable. The variable name `x` binds to the integer object `100` stored at `#1001`.'
      },
      {
        code: `<div class="vis-line">x = 100</div>
<div class="vis-line active">y = x</div>
<div class="vis-line">x = 200</div>`,
        stack: [
          { name: 'x', ref: '#1001' },
          { name: 'y', ref: '#1001' }
        ],
        heap: [
          { ref: '#1001', val: '100', type: 'Int' }
        ],
        desc: 'The label `y` points to the exact same immutable integer object `#1001`.'
      },
      {
        code: `<div class="vis-line">x = 100</div>
<div class="vis-line">y = x</div>
<div class="vis-line active">x = 200</div>`,
        stack: [
          { name: 'x', ref: '#1002' },
          { name: 'y', ref: '#1001' }
        ],
        heap: [
          { ref: '#1001', val: '100', type: 'Int' },
          { ref: '#1002', val: '200', type: 'Int' }
        ],
        desc: 'Since integers are immutable, Python does not change the object `#1001`. It spawns a new integer `200` at `#1002` and rebinds `x`. `y` remains bound to `100`.'
      }
    ],
    'vis-funcs': [
      {
        code: `<div class="vis-line active"># Call stack tracking</div>
<div class="vis-line">msg = "Global Level"</div>
<div class="vis-line">def call_func():</div>
<div class="vis-line">    val = "Local Level"</div>`,
        stack: [
          { name: 'Global namespace', ref: '#global-frame' }
        ],
        heap: [
          { ref: '#global-frame', val: '{"msg": "Global Level"}', type: 'ScopeFrame' }
        ],
        desc: 'The runtime prepares the Global Execution frame containing variables declared outside functions.'
      },
      {
        code: `<div class="vis-line"># Call stack tracking</div>
<div class="vis-line">msg = "Global Level"</div>
<div class="vis-line active">call_func()</div>
<div class="vis-line">    val = "Local Level"</div>`,
        stack: [
          { name: 'Global namespace', ref: '#global-frame' },
          { name: 'call_func() Frame', ref: '#func-frame' }
        ],
        heap: [
          { ref: '#global-frame', val: '{"msg": "Global Level"}', type: 'ScopeFrame' },
          { ref: '#func-frame', val: '{"val": "Local Level"}', type: 'ScopeFrame' }
        ],
        desc: 'A call to `call_func()` creates and pushes a new Execution frame onto the Call Stack to isolate its local variables.'
      }
    ]
  };

  const visCodeBody = document.getElementById('vis-code-body');
  const stackNodesContainer = document.getElementById('stack-nodes');
  const heapNodesContainer = document.getElementById('heap-nodes');
  const visStepCounter = document.getElementById('vis-step-counter');
  const visPrevBtn = document.getElementById('vis-prev-btn');
  const visNextBtn = document.getElementById('vis-next-btn');

  document.querySelectorAll('.vis-scen-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.vis-scen-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.visScenario = btn.dataset.scenario;
      state.visStep = 0;
      renderVisualizer();
    });
  });

  visPrevBtn.addEventListener('click', () => {
    if (state.visStep > 0) {
      state.visStep--;
      renderVisualizer();
    }
  });

  visNextBtn.addEventListener('click', () => {
    const totalSteps = visualizerScenarios[state.visScenario].length;
    if (state.visStep < totalSteps - 1) {
      state.visStep++;
      renderVisualizer();
    }
  });

  function renderVisualizer() {
    const scenarioData = visualizerScenarios[state.visScenario];
    const currentStepData = scenarioData[state.visStep];
    const totalSteps = scenarioData.length;

    visPrevBtn.disabled = state.visStep === 0;
    visNextBtn.disabled = state.visStep === totalSteps - 1;

    visStepCounter.textContent = `Step ${state.visStep + 1} of ${totalSteps}`;

    visCodeBody.innerHTML = currentStepData.code + `<div class="comment" style="margin-top:20px; font-family:var(--font-sans);">${currentStepData.desc}</div>`;

    stackNodesContainer.innerHTML = '';
    currentStepData.stack.forEach(node => {
      const el = document.createElement('div');
      el.className = 'memory-node stack-node';
      el.innerHTML = `
        <span class="node-label">${node.name}</span>
        <span class="node-pointer">points to <i class="fa-solid fa-arrow-right"></i></span>
        <span class="node-value">${node.ref}</span>
      `;
      stackNodesContainer.appendChild(el);
    });

    heapNodesContainer.innerHTML = '';
    currentStepData.heap.forEach(node => {
      const el = document.createElement('div');
      el.className = 'memory-node heap-node';
      el.innerHTML = `
        <div>
          <span class="node-value">${node.val}</span>
          <span class="node-ref-id">${node.ref}</span>
        </div>
        <span class="node-label" style="font-size:0.75rem; color:var(--text-muted);">${node.type}</span>
      `;
      heapNodesContainer.appendChild(el);
    });
  }

  renderVisualizer();


  // ==========================================
  // 10. THE FORGE ASSESSMENT (QUIZ)
  // ==========================================
  const quizQuestions = [
    {
      question: "Which of the following is true about code blocks in Python?",
      options: [
        "They are enclosed in curly braces { }",
        "They are defined by consistent whitespace indentation",
        "They are terminated with a semicolon ;",
        "They require BEGIN and END keywords"
      ],
      correct: 1,
      explanation: "Unlike many other languages, Python uses consistent whitespace indentation (typically 4 spaces) to define block boundaries and structure."
    },
    {
      question: "What is the primary benefit of using a 'with' statement when opening a file in Python?",
      options: [
        "It automatically compiles the file to bytecode",
        "It speeds up file read operations by caching in RAM",
        "It guarantees the file handle is safely closed even if errors occur",
        "It encrypts the file automatically for security"
      ],
      correct: 2,
      explanation: "The 'with' statement implements the context manager protocol, ensuring files are closed automatically and reliably when exiting the block."
    },
    {
      question: "Which import statement is generally discouraged in production code due to potential naming conflicts?",
      options: [
        "import math",
        "from math import sqrt, pi",
        "import random as rnd",
        "from math import *"
      ],
      correct: 3,
      explanation: "Wildcard imports (e.g. 'from math import *') pull all symbols into the current namespace, which can cause variable name shadowing and conflicts."
    },
    {
      question: "What is the stdout value of the following Python block?\n\na = [1, 2]\nb = a\na.append(3)\nprint(b)",
      options: [
        "[1, 2]",
        "[1, 2, 3]",
        "Traceback Error",
        "None"
      ],
      correct: 1,
      explanation: "Because `b = a` assigns `b` to the exact same list reference object on the Heap space, mutating the list object through `a.append()` changes what `b` points to as well."
    },
    {
      question: "Which keyword is used in a function definition to make it return a Generator Iterator instead of a single value?",
      options: [
        "return",
        "yield",
        "lambda",
        "raise"
      ],
      correct: 1,
      explanation: "The `yield` statement suspends function execution state and sends a value back to the caller, retaining local scope state to resume immediately on next retrieval."
    },
    {
      question: "How does Python handle lookups when trying to locate variable scope names?",
      options: [
        "First found globally, then locally",
        "LEGB rule: Local -> Enclosing -> Global -> Built-in",
        "Strictly local scope only",
        "Alphabetically sorted lookup index"
      ],
      correct: 1,
      explanation: "Python searches namespaces from inside-out following the LEGB rule (Local, Enclosing function scopes, Globals, and then Built-ins)."
    },
    {
      question: "Which magic (dunder) method would you implement to customize the behavior of the built-in len() function for your custom class?",
      options: [
        "__size__",
        "__len__",
        "__count__",
        "__init__"
      ],
      correct: 1,
      explanation: "Implementing `__len__(self)` hooks your class instances directly to return integer size values when evaluated via the global `len()` command."
    },
    {
      question: "What is the primary mechanism that allows Decorators to remember local scope variables even after outer wrapper functions have returned?",
      options: [
        "Dynamic compiler copying",
        "Closures",
        "Global variable injection",
        "Thread locks"
      ],
      correct: 1,
      explanation: "A Closure is a nested function object that remembers values in its enclosing scopes even if they are not present in memory stack frames anymore."
    }
  ];

  const quizCard = document.getElementById('quiz-card');
  const quizResultCard = document.getElementById('quiz-result-card');
  const quizCounter = document.getElementById('quiz-counter');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsContainer = document.getElementById('quiz-options-container');
  const quizExplanationPanel = document.getElementById('quiz-explanation-panel');
  const explanationTitle = document.getElementById('explanation-title');
  const explanationTextContent = document.getElementById('explanation-text-content');

  function renderQuizQuestion() {
    quizExplanationPanel.classList.add('hidden');
    
    const index = state.quizCurrentQuestionIndex;
    if (index >= quizQuestions.length) {
      showQuizResults();
      return;
    }

    const questionData = quizQuestions[index];
    quizCounter.textContent = `Question ${index + 1} of ${quizQuestions.length}`;
    quizQuestionText.innerHTML = questionData.question.replace(/\n/g, '<br>');

    quizOptionsContainer.innerHTML = '';
    questionData.options.forEach((opt, idx) => {
      const button = document.createElement('button');
      button.className = 'quiz-option';
      button.textContent = opt;
      button.addEventListener('click', () => handleOptionSelection(idx, button));
      quizOptionsContainer.appendChild(button);
    });
  }

  function handleOptionSelection(selectedIdx, buttonEl) {
    const index = state.quizCurrentQuestionIndex;
    const questionData = quizQuestions[index];

    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.style.pointerEvents = 'none';
      if (btn.textContent === questionData.options[questionData.correct]) {
        btn.classList.add('correct');
      }
    });

    if (selectedIdx === questionData.correct) {
      buttonEl.classList.add('correct');
      explanationTitle.innerHTML = '<i class="fa-solid fa-circle-check text-mint"></i> Correct Answer!';
      state.quizScore++;
    } else {
      buttonEl.classList.add('wrong');
      explanationTitle.innerHTML = '<i class="fa-solid fa-circle-xmark text-pink"></i> Incorrect Answer';
    }

    explanationTextContent.textContent = questionData.explanation;
    quizExplanationPanel.classList.remove('hidden');
  }

  document.getElementById('quiz-next-question-btn').addEventListener('click', () => {
    state.quizCurrentQuestionIndex++;
    renderQuizQuestion();
  });

  function showQuizResults() {
    quizCard.classList.add('hidden');
    quizResultCard.classList.remove('hidden');

    const scoreValue = document.getElementById('result-score-value');
    const xpValue = document.getElementById('result-xp-value');
    
    scoreValue.textContent = `${state.quizScore} / ${quizQuestions.length}`;
    
    const earnedXp = state.quizScore * 100;
    xpValue.textContent = earnedXp;
    
    addXP(earnedXp);

    const newBadgeTitle = document.getElementById('new-badge-title');
    newBadgeTitle.textContent = state.currentBadge;
  }

  document.getElementById('restart-quiz-btn').addEventListener('click', () => {
    state.quizCurrentQuestionIndex = 0;
    state.quizScore = 0;
    
    quizResultCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    
    renderQuizQuestion();
  });

  // Init App Settings
  renderQuizQuestion();
  updateStatsDisplay();

  // ==========================================
  // 11. SCROLL SPY FOR ACTIVE NAVIGATION LINKS
  // ==========================================
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  function activeMenuHighlight() {
    let scrollY = window.pageYOffset;
    
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120; // Accounts for sticky header offset
      const sectionId = section.getAttribute('id');
      
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  
  window.addEventListener('scroll', activeMenuHighlight);
  activeMenuHighlight(); // Run once to highlight initial viewport

  // ==========================================
  // 12. PYTHON RELEASE & DOCUMENTATION AUTO-SYNC
  // ==========================================
  async function runAutoSync() {
    const syncStatusText = document.getElementById('sync-status-text');
    const footerDocsLink = document.getElementById('footer-docs-link');

    try {
      // 1. Fetch latest Python release cycle details from endoflife.date
      const response = await fetch('https://endoflife.date/api/python.json');
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      
      const latestCycle = data[0]; // e.g. { cycle: "3.12", latest: "3.12.3", ... }
      if (latestCycle && latestCycle.latest) {
        const pyVer = latestCycle.latest;
        const pyCycle = latestCycle.cycle;

        // Update footer documentation link dynamically
        if (footerDocsLink) {
          footerDocsLink.href = `https://docs.python.org/${pyCycle}/`;
          footerDocsLink.innerHTML = `<i class="fa-solid fa-book"></i> Python ${pyCycle} Documentation`;
        }

        // Update sync status text in footer
        if (syncStatusText) {
          syncStatusText.innerHTML = `<i class="fa-solid fa-circle-check text-mint"></i> Synced with Python v${pyVer}`;
        }
        
        console.log(`[Auto-Sync] Python version data resolved: v${pyVer} (Cycle: ${pyCycle})`);
      }
    } catch (err) {
      console.warn('[Auto-Sync] Failed to fetch Python release data: ', err);
      if (syncStatusText) {
        syncStatusText.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-gold"></i> Offline (using Python 3.11 docs)`;
      }
    }

    try {
      // 2. Fetch latest stable Pyodide release from jsDelivr API
      const pyodideRes = await fetch('https://data.jsdelivr.net/v1/packages/npm/pyodide');
      if (!pyodideRes.ok) throw new Error('Pyodide package check failed');
      const pyodideData = await pyodideRes.json();
      
      const latestPyodideVer = pyodideData.tags && pyodideData.tags.latest;
      if (latestPyodideVer) {
        console.log(`[Auto-Sync] Latest available Pyodide Core release: v${latestPyodideVer}`);
        
        // If current script matches v0.25.0 but there's a newer one, let's log it or print a status in console
        const currentPyodideVersion = '0.25.0';
        if (latestPyodideVer !== currentPyodideVersion) {
          logTerminal(`>>> System Update: Python WASM Core v${latestPyodideVer} is available (Current: v${currentPyodideVersion}).`, 'system');
        }
      }
    } catch (err) {
      console.warn('[Auto-Sync] Failed to check Pyodide package version: ', err);
    }
  }

  // Trigger auto sync on startup
  runAutoSync();

  // ==========================================
  // 13. DATA FORGE (DATA ANALYSIS) MODULE
  // ==========================================

  const dataTemplates = {
    'data-avg': `# Scenario 1: Calculate Revenue Averages per Region
# We use the pre-loaded variable 'sales_data'

# 1. Initialize aggregators
region_stats = {}

for row in sales_data:
    region = row["region"]
    rev = row["revenue"]
    units = row["units"]
    
    if region not in region_stats:
        region_stats[region] = {"total_revenue": 0, "total_units": 0, "count": 0}
        
    region_stats[region]["total_revenue"] += rev
    region_stats[region]["total_units"] += units
    region_stats[region]["count"] += 1

# 2. Compute averages and format for visualization
chart_data = []
print("--- Region Sales Summary Averages ---")
for region, stats in region_stats.items():
    avg_rev = stats["total_revenue"] / stats["count"]
    avg_units = stats["total_units"] / stats["count"]
    print(f"Region: {region} | Avg Revenue: \${avg_rev:,.2f} | Avg Units: {avg_units:.1f}")
    
    chart_data.append({
        "label": region,
        "value": avg_rev
    })

# 3. Output payload for dynamic SVG charting
import json
print(f"[[ {json.dumps(chart_data)} ]]")`,

    'data-filter': `# Scenario 2: Filter and Plot Monthly Sales for North Region
# We use the pre-loaded variable 'sales_data'

# 1. Filter records for North region
north_sales = [row for row in sales_data if row["region"] == "North"]

# 2. Sort chronologically (Jan -> Jun)
months_order = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6}
north_sales.sort(key=lambda x: months_order.get(x["month"], 0))

# 3. Print monthly statistics
print("--- Monthly Revenue for North Region ---")
chart_data = []
for row in north_sales:
    month = row["month"]
    rev = row["revenue"]
    units = row["units"]
    print(f"Month: {month} | Revenue: \${rev:,} | Units Sold: {units}")
    
    chart_data.append({
        "label": month,
        "value": rev
    })

# 4. Output payload for dynamic SVG charting
import json
print(f"[[ {json.dumps(chart_data)} ]]")`,

    'data-growth': `# Scenario 3: Monthly Aggregate Revenue & Cumulative Growth
# We use the pre-loaded variable 'sales_data'

# 1. Group and sum revenue by month
monthly_revenue = {}
for row in sales_data:
    month = row["month"]
    rev = row["revenue"]
    monthly_revenue[month] = monthly_revenue.get(month, 0) + rev

# 2. Sort months chronologically
months_order = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6}
sorted_months = sorted(monthly_revenue.keys(), key=lambda m: months_order.get(m, 0))

# 3. Calculate cumulative revenue and growth rates
cumulative_rev = 0
chart_data = []
print("--- Store-wide Cumulative Revenue & Growth ---")

prev_rev = None
for month in sorted_months:
    rev = monthly_revenue[month]
    cumulative_rev += rev
    
    # Calculate MoM Growth
    if prev_rev is not None:
        growth = ((rev - prev_rev) / prev_rev) * 100
        growth_str = f"{growth:+.1f}% MoM"
    else:
        growth_str = "Baseline"
        
    print(f"Month: {month} | Month Rev: \${rev:,.2f} | Cum. Rev: \${cumulative_rev:,.2f} ({growth_str})")
    prev_rev = rev
    
    chart_data.append({
        "label": month,
        "value": cumulative_rev
    })

# 4. Output payload for dynamic SVG charting
import json
print(f"[[ {json.dumps(chart_data)} ]]")`,

    'data-custom': `# Write your custom Python data analyzer here!
# Pre-loaded variable 'sales_data' is a list of dictionaries.
# Ensure your print output contains a json payload in double brackets:
# print("[[ " + json.dumps(chart_data) + " ]]")
import json

# Example: Plot monthly units sold (all regions combined)
monthly_units = {}
for r in sales_data:
    monthly_units[r['month']] = monthly_units.get(r['month'], 0) + r['units']

months_order = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6}
sorted_months = sorted(monthly_units.keys(), key=lambda m: months_order.get(m, 0))

payload = [{"label": m, "value": monthly_units[m]} for m in sorted_months]
print("--- Monthly Combined Units Sold ---")
for item in payload:
    print(f"Month: {item['label']} | Units: {item['value']}")

print(f"[[ {json.dumps(payload)} ]]")`
  };

  const dataBasicsNotesText = `# Reference Notes: Foundations of Data Analysis

Data Analysis is the systematic process of cleaning, transforming, and modeling raw data to discover useful information, draw conclusions, and support decision-making.

---

## 1. The Data Pipeline Lifecycle

Every analytics task follows a structured sequence of operations:
1. **Data Acquisition**: Fetching raw data from files (CSV, JSON), databases, or API responses.
2. **Data Cleaning & Preprocessing**: Correcting formatting, dropping duplicates, and handling missing observations.
3. **Exploratory Data Analysis (EDA)**: Calculating summary statistics to understand correlations and value spreads.
4. **Data Visualization**: Transforming numbers into graphical charts (bar charts, histograms, line graphs) to reveal trends.

---

## 2. Core Data Cleaning Techniques

Raw real-world datasets are notoriously noisy. Before modeling data, you must clean it:

### Handling Missing (Null) Values:
* **Deletion**: Drop records containing missing fields entirely.
* **Imputation**: Replace missing fields with a calculated value, such as the dataset's **mean** or **median**.

### Outlier Detection:
Outliers are extreme anomalies that skew averages. They are often identified using:
* **Standard Deviation method**: Values that fall further than 3 standard deviations from the mean.
* **Interquartile Range (IQR)**: Checking bounds relative to the 25th and 75th percentiles.

---

## 3. Statistical Summarization (First Principles)

To analyze any numeric series, we compute the following summary metrics:

### Mean (Arithmetic Average)
The sum of all values divided by the count.
$$\\text{Mean} (\\mu) = \\frac{\\sum_{i=1}^{n} x_i}{n}$$

### Median (Middle Value)
The middle value when the data is sorted in ascending order.
* If $n$ is odd: The value at index $\\frac{n+1}{2}$.
* If $n$ is even: The average of values at indexes $\\frac{n}{2}$ and $\\frac{n}{2} + 1$.
* **Why it matters**: The median is highly robust against outliers.

### Variance & Standard Deviation
Measure the spread of data around the mean. Standard deviation is the square root of variance:
$$\\text{Variance} (\\sigma^2) = \\frac{\\sum (x_i - \\mu)^2}{n}$$
$$\\text{Standard Deviation} (\\sigma) = \\sqrt{\\text{Variance}}$$
`;

  const dataPythonNotesText = `# Reference Notes: Data Analysis with Python

While libraries like Pandas and NumPy are standard in professional data science, understanding how to clean, aggregate, and format datasets using **pure Python** is essential for building core coding skills.

---

## 1. Structuring Datasets with Collections

In pure Python, datasets are typically modeled as a **list of dictionaries** (mimicking rows in a SQL table or CSV records):

\`\`\`python
sales_data = [
    {"month": "Jan", "region": "North", "revenue": 12000, "units": 450},
    {"month": "Jan", "region": "South", "revenue": 15000, "units": 600},
    {"month": "Feb", "region": "North", "revenue": 14000, "units": 500},
    {"month": "Feb", "region": "South", "revenue": 18000, "units": 720}
]
\`\`\`

---

## 2. Cleaning Datasets in Python

Here is how you clean data (e.g. dropping records with missing revenue fields or bad formats) using list comprehensions:

\`\`\`python
raw_records = [
    {"item": "Laptop", "price": 999.00},
    {"item": "Mouse", "price": None},
    {"item": "Keyboard", "price": 45.00},
    {"item": "Monitor", "price": -10.00}
]

# Clean pipeline: keep price if not None and greater than 0
clean_records = [r for r in raw_records if r["price"] is not None and r["price"] > 0]
print(clean_records)
\`\`\`

---

## 3. Data Aggregations & Grouping

To aggregate metrics (like grouping revenue by region or month), use dictionary accumulators:

\`\`\`python
# Grouping revenue by region
revenue_by_region = {}

for record in sales_data:
    region = record["region"]
    revenue = record["revenue"]
    
    if region not in revenue_by_region:
        revenue_by_region[region] = 0
    revenue_by_region[region] += revenue

print(revenue_by_region)
\`\`\`

---

## 4. Formatting Datasets for Charting Engines

When sending calculated data to visualization widgets (like SVG charters or HTML interfaces), format the aggregated results as structured JSON:

\`\`\`python
import json

chart_data = []
for label, value in revenue_by_region.items():
    chart_data.append({
        "label": label,
        "value": value
    })

# Convert to JSON string
json_payload = json.dumps(chart_data)

# Print with special brackets so JavaScript can extract and plot it live
print(f"[[ {json_payload} ]]")
\`\`\`
`;

  // HTML nodes cache
  const dataCodeTextarea = document.getElementById('data-code-textarea');
  const dataLineNumbers = document.getElementById('data-line-numbers');
  const dataScenarioSelect = document.getElementById('data-scenario-select');
  const dataTerminalBody = document.getElementById('data-terminal-body');
  const runDataCodeBtn = document.getElementById('run-data-code-btn');
  const resetDataCodeBtn = document.getElementById('reset-data-code-btn');
  const clearDataTerminalBtn = document.getElementById('clear-data-terminal-btn');
  const dataChartTooltipEl = document.getElementById('data-chart-tooltip');
  
  // Tab panels & buttons
  const dataTabSandbox = document.getElementById('data-tab-sandbox');
  const dataTabGuideBasics = document.getElementById('data-tab-guide-basics');
  const dataTabGuidePython = document.getElementById('data-tab-guide-python');
  
  const dataPanelSandbox = document.getElementById('data-panel-sandbox');
  const dataPanelGuideBasics = document.getElementById('data-panel-guide-basics');
  const dataPanelGuidePython = document.getElementById('data-panel-guide-python');
  
  const dataGuideBasicsContent = document.getElementById('data-guide-basics-content');
  const dataGuidePythonContent = document.getElementById('data-guide-python-content');
  
  let dataChartType = 'bar'; // default chart format
  let currentChartData = null;
  let chartAnimId = null;

  // Markdown renderer
  function parseMarkdown(md) {
    let html = md;
    // Basic escapes
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    
    // Rules
    html = html.replace(/^---$/gim, '<hr>');
    
    // Bold / Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```python\s*([\s\S]*?)\s*```/g, '<pre class="code-block-study"><code class="fira-code">$1</code></pre>');
    html = html.replace(/```([\s\S]*?)\s*```/g, '<pre class="code-block-study"><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Math
    html = html.replace(/\$\$(.*?)\$\$/g, '<div class="math-block">$1</div>');
    html = html.replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>');
    
    // Lists
    html = html.replace(/^\*\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\-\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\.\s+(.*$)/gim, '<li>$1</li>');
    
    const blocks = html.split('\n\n');
    const processed = blocks.map(block => {
      let trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<hr') || trimmed.startsWith('<div')) {
        return trimmed;
      }
      if (trimmed.startsWith('<li>')) {
        return '<ul>' + trimmed + '</ul>';
      }
      return '<p>' + trimmed.replace(/\n/g, '<br>') + '</p>';
    });
    
    return processed.join('\n');
  }

  // Load study guide contents
  async function loadStudyGuide(type, targetEl, fallbackText, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Load failed");
      const md = await response.text();
      targetEl.innerHTML = parseMarkdown(md);
    } catch (e) {
      console.warn(`[Data Forge] Notes fetch failed (probably CORS file:// access), using packaged notes: ${e}`);
      targetEl.innerHTML = parseMarkdown(fallbackText);
    }
  }

  // Load guides
  loadStudyGuide('basics', dataGuideBasicsContent, dataBasicsNotesText, 'notes/data_basics_notes.md');
  loadStudyGuide('python', dataGuidePythonContent, dataPythonNotesText, 'notes/data_python_notes.md');

  // Tab controls
  function switchDataTab(activeTab) {
    dataTabSandbox.classList.remove('active');
    dataTabGuideBasics.classList.remove('active');
    dataTabGuidePython.classList.remove('active');
    
    dataPanelSandbox.classList.add('hidden');
    dataPanelGuideBasics.classList.add('hidden');
    dataPanelGuidePython.classList.add('hidden');
    
    if (activeTab === 'sandbox') {
      dataTabSandbox.classList.add('active');
      dataPanelSandbox.classList.remove('hidden');
    } else if (activeTab === 'basics') {
      dataTabGuideBasics.classList.add('active');
      dataPanelGuideBasics.classList.remove('hidden');
      addXP(10);
    } else if (activeTab === 'python') {
      dataTabGuidePython.classList.add('active');
      dataPanelGuidePython.classList.remove('hidden');
      addXP(10);
    }
  }

  dataTabSandbox.addEventListener('click', () => switchDataTab('sandbox'));
  dataTabGuideBasics.addEventListener('click', () => switchDataTab('basics'));
  dataTabGuidePython.addEventListener('click', () => switchDataTab('python'));

  // Editor configuration
  function updateDataLineNumbers(text) {
    const linesCount = text.split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= Math.max(linesCount, 10); i++) {
      numbersHtml += `<span>${i}</span>`;
    }
    dataLineNumbers.innerHTML = numbersHtml;
  }

  dataCodeTextarea.addEventListener('input', () => {
    updateDataLineNumbers(dataCodeTextarea.value);
  });

  dataScenarioSelect.addEventListener('change', () => {
    const val = dataScenarioSelect.value;
    if (dataTemplates[val]) {
      dataCodeTextarea.value = dataTemplates[val];
      updateDataLineNumbers(dataTemplates[val]);
      clearDataTerminal();
      logDataTerminal(`>>> Scenario "${val}" loaded. Click 'Run Analysis' to process.`, 'system');
      
      // Update interactive highlights on the explorer table
      highlightExplorerTable(val);
    }
  });

  // Table row highlighting logic
  function highlightExplorerTable(scenario) {
    const rows = document.querySelectorAll('#sales-data-table tbody tr');
    rows.forEach(r => r.classList.remove('highlighted'));
    
    if (scenario === 'data-filter') {
      rows.forEach(r => {
        if (r.dataset.region === 'North') r.classList.add('highlighted');
      });
    } else if (scenario === 'data-avg') {
      rows.forEach(r => r.classList.add('highlighted'));
    }
  }

  // Interactive Table click handlers
  document.querySelectorAll('#sales-data-table tbody tr').forEach(row => {
    row.addEventListener('click', () => {
      const region = row.dataset.region;
      
      // Highlight matching region rows
      document.querySelectorAll('#sales-data-table tbody tr').forEach(r => {
        if (r.dataset.region === region) {
          r.classList.add('highlighted');
        } else {
          r.classList.remove('highlighted');
        }
      });
      
      logDataTerminal(`>>> Clicked ${region} Region Row. Try modifying code to filter regional sales: \n[row for row in sales_data if row["region"] == "${region}"]`, 'system');
      addXP(5);
    });
  });

  // Editor Actions
  runDataCodeBtn.addEventListener('click', () => {
    executeDataAnalysisCode(dataCodeTextarea.value);
  });

  resetDataCodeBtn.addEventListener('click', () => {
    const val = dataScenarioSelect.value;
    if (dataTemplates[val]) {
      dataCodeTextarea.value = dataTemplates[val];
    } else {
      dataCodeTextarea.value = '';
    }
    updateDataLineNumbers(dataCodeTextarea.value);
    clearDataTerminal();
    logDataTerminal('>>> Editor reset.', 'system');
  });

  clearDataTerminalBtn.addEventListener('click', clearDataTerminal);

  function clearDataTerminal() {
    dataTerminalBody.innerHTML = '';
  }

  function logDataTerminal(message, type = 'val') {
    const line = document.createElement('div');
    line.className = `terminal-output-line output-${type}`;
    line.textContent = message;
    dataTerminalBody.appendChild(line);
    dataTerminalBody.scrollTop = dataTerminalBody.scrollHeight;
  }

  // Execute CPython WebAssembly
  async function executeDataAnalysisCode(code) {
    clearDataTerminal();
    logDataTerminal('>>> Processing sandbox analysis...', 'system');
    
    // Inject the mock sales data before compiling user script
    const datasetInjection = `
sales_data = [
    {"month": "Jan", "region": "North", "units": 450, "revenue": 12000},
    {"month": "Jan", "region": "South", "units": 600, "revenue": 15000},
    {"month": "Feb", "region": "North", "units": 500, "revenue": 14000},
    {"month": "Feb", "region": "South", "units": 720, "revenue": 18000},
    {"month": "Mar", "region": "North", "units": 580, "revenue": 16500},
    {"month": "Mar", "region": "South", "units": 800, "revenue": 20000},
    {"month": "Apr", "region": "North", "units": 620, "revenue": 17500},
    {"month": "Apr", "region": "South", "units": 850, "revenue": 22000},
    {"month": "May", "region": "North", "units": 700, "revenue": 19500},
    {"month": "May", "region": "South", "units": 900, "revenue": 24000},
    {"month": "Jun", "region": "North", "units": 850, "revenue": 24000},
    {"month": "Jun", "region": "South", "units": 1050, "revenue": 29000}
]
`;

    if (pyodideInstance) {
      try {
        await pyodideInstance.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
        `);
        
        // Load variables
        await pyodideInstance.runPythonAsync(datasetInjection);
        // Load user script
        await pyodideInstance.runPythonAsync(code);
        
        const stdout = pyodideInstance.runPython("sys.stdout.getvalue()");
        const stderr = pyodideInstance.runPython("sys.stderr.getvalue()");
        
        processWasmOutputs(stdout, stderr);
      } catch (err) {
        logDataTerminal(err.message, 'err');
      }
    } else {
      // offline mode fallback
      const val = dataScenarioSelect.value;
      let mockStdout = "";
      if (val === 'data-avg') {
        mockStdout = "--- Region Sales Summary Averages ---\nRegion: North | Avg Revenue: $17,250.00 | Avg Units: 616.7\nRegion: South | Avg Revenue: $21,333.33 | Avg Units: 820.0\n[[ [{\"label\": \"North\", \"value\": 17250}, {\"label\": \"South\", \"value\": 21333.33}] ]]";
      } else if (val === 'data-filter') {
        mockStdout = "--- Monthly Revenue for North Region ---\nMonth: Jan | Revenue: $12,000 | Units Sold: 450\nMonth: Feb | Revenue: $14,000 | Units Sold: 500\nMonth: Mar | Revenue: $16,500 | Units Sold: 580\nMonth: Apr | Revenue: $17,500 | Units Sold: 620\nMonth: May | Revenue: $19,500 | Units Sold: 700\nMonth: Jun | Revenue: $24,000 | Units Sold: 850\n[[ [{\"label\": \"Jan\", \"value\": 12000}, {\"label\": \"Feb\", \"value\": 14000}, {\"label\": \"Mar\", \"value\": 16500}, {\"label\": \"Apr\", \"value\": 17500}, {\"label\": \"May\", \"value\": 19500}, {\"label\": \"Jun\", \"value\": 24000}] ]]";
      } else if (val === 'data-growth') {
        mockStdout = "--- Store-wide Cumulative Revenue & Growth ---\nMonth: Jan | Month Rev: $27,000.00 | Cum. Rev: $27,000.00 (Baseline)\nMonth: Feb | Month Rev: $32,000.00 | Cum. Rev: $59,000.00 (+18.5% MoM)\nMonth: Mar | Month Rev: $36,500.00 | Cum. Rev: $95,500.00 (+14.1% MoM)\nMonth: Apr | Month Rev: $39,500.00 | Cum. Rev: $135,000.00 (+8.2% MoM)\nMonth: May | Month Rev: $43,500.00 | Cum. Rev: $178,500.00 (+10.1% MoM)\nMonth: Jun | Month Rev: $53,000.00 | Cum. Rev: $231,500.00 (+21.8% MoM)\n[[ [{\"label\": \"Jan\", \"value\": 27000}, {\"label\": \"Feb\", \"value\": 59000}, {\"label\": \"Mar\", \"value\": 95500}, {\"label\": \"Apr\", \"value\": 135000}, {\"label\": \"May\", \"value\": 178500}, {\"label\": \"Jun\", \"value\": 231500}] ]]";
      } else {
        mockStdout = "Offline mode fallback: CPython core not resolved yet. Write code when connection is online.";
      }
      processWasmOutputs(mockStdout, "");
    }
  }

  function processWasmOutputs(stdout, stderr) {
    if (stderr) {
      logDataTerminal(stderr, 'err');
      return;
    }
    
    // Parse double brackets
    const bracketRegex = /\[\[\s*([\s\S]*?)\s*\]\]/;
    const match = stdout.match(bracketRegex);
    
    let chartPayload = null;
    if (match) {
      try {
        chartPayload = JSON.parse(match[1]);
      } catch (err) {
        logDataTerminal("Chart parsing error: printed invalid JSON inside double brackets [[ ]]", "err");
      }
    }
    
    // Display cleaned stdout (remove the bracket payload from display text)
    const cleanStdout = stdout.replace(bracketRegex, '').trim();
    if (cleanStdout) {
      logDataTerminal(cleanStdout, 'val');
    } else if (!chartPayload) {
      logDataTerminal("(No stdout printed)", "val");
    }
    
    if (chartPayload) {
      logDataTerminal("Plotting dynamic chart visualization...", "success");
      animateChart(chartPayload);
      addXP(30);
    }
  }

  // Animating chart
  function animateChart(data) {
    if (chartAnimId) cancelAnimationFrame(chartAnimId);
    
    const duration = 600;
    const start = performance.now();
    
    function drawStep(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic easing
      const ease = 1 - Math.pow(1 - progress, 3);
      
      renderDataAnalysisChart(data, ease);
      
      if (progress < 1) {
        chartAnimId = requestAnimationFrame(drawStep);
      }
    }
    chartAnimId = requestAnimationFrame(drawStep);
  }

  function renderDataAnalysisChart(data, ease = 1) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    currentChartData = data;
    
    const svg = document.getElementById('analysis-chart-canvas');
    if (!svg) return;
    
    // Clear dynamic elements
    svg.querySelectorAll('.dynamic-plot-element').forEach(el => el.remove());
    
    const maxVal = Math.max(...data.map(d => d.value), 10);
    const yMax = maxVal * 1.15;
    
    const plotLeft = 60;
    const plotRight = 570;
    const plotTop = 30;
    const plotBottom = 250;
    
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;
    
    // Render Y ticks & labels
    const ticksCount = 5;
    for (let i = 0; i < ticksCount; i++) {
      const val = (yMax / (ticksCount - 1)) * i;
      const y = plotBottom - (i / (ticksCount - 1)) * plotHeight;
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", plotLeft - 10);
      text.setAttribute("y", y + 4);
      text.setAttribute("fill", "var(--text-secondary)");
      text.setAttribute("text-anchor", "end");
      text.setAttribute("font-size", "10");
      text.setAttribute("font-family", "var(--font-sans)");
      text.className = 'dynamic-plot-element';
      
      if (val >= 1000) {
        text.textContent = `$${(val / 1000).toFixed(1)}k`;
      } else {
        text.textContent = `$${val.toFixed(0)}`;
      }
      svg.appendChild(text);
    }
    
    // Redraw axis lines to make sure they are on top of ticks
    
    if (dataChartType === 'bar') {
      const n = data.length;
      const spacing = plotWidth / n;
      const barWidth = spacing * 0.6;
      
      data.forEach((d, i) => {
        const x = plotLeft + i * spacing + (spacing - barWidth) / 2;
        const targetHeight = (d.value / yMax) * plotHeight;
        const currentHeight = targetHeight * ease;
        const y = plotBottom - currentHeight;
        
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", currentHeight);
        rect.setAttribute("rx", "4");
        rect.setAttribute("ry", "4");
        rect.setAttribute("fill", "url(#data-bar-gradient)");
        rect.className = 'chart-bar dynamic-plot-element';
        
        ensureSvgGradients(svg);
        
        rect.addEventListener('mousemove', (e) => {
          showChartTooltip(e, d.label, d.value);
        });
        rect.addEventListener('mouseout', hideChartTooltip);
        
        svg.appendChild(rect);
        
        // X-label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x + barWidth / 2);
        label.setAttribute("y", plotBottom + 20);
        label.setAttribute("fill", "var(--text-secondary)");
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "10");
        label.setAttribute("font-weight", "600");
        label.setAttribute("font-family", "var(--font-sans)");
        label.className = 'dynamic-plot-element';
        label.textContent = d.label;
        svg.appendChild(label);
      });
    } else if (dataChartType === 'line') {
      const n = data.length;
      const spacing = n > 1 ? plotWidth / (n - 1) : plotWidth;
      
      let pathD = '';
      let areaD = `M ${plotLeft} ${plotBottom}`;
      
      const points = [];
      data.forEach((d, i) => {
        const x = plotLeft + i * spacing;
        const targetHeight = (d.value / yMax) * plotHeight;
        const currentHeight = targetHeight * ease;
        const y = plotBottom - currentHeight;
        points.push({ x, y, label: d.label, value: d.value });
        
        if (i === 0) {
          pathD += `M ${x} ${y}`;
        } else {
          pathD += ` L ${x} ${y}`;
        }
        areaD += ` L ${x} ${y}`;
      });
      
      areaD += ` L ${plotLeft + (n - 1) * spacing} ${plotBottom} Z`;
      
      if (points.length > 0) {
        ensureSvgGradients(svg);
        const areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        areaPath.setAttribute("d", areaD);
        areaPath.setAttribute("fill", "url(#data-line-area-gradient)");
        areaPath.className = 'dynamic-plot-element';
        svg.appendChild(areaPath);
        
        const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        linePath.setAttribute("d", pathD);
        linePath.setAttribute("fill", "none");
        linePath.setAttribute("stroke", "var(--accent-cyan)");
        linePath.setAttribute("stroke-width", "3");
        linePath.className = 'dynamic-plot-element';
        svg.appendChild(linePath);
      }
      
      points.forEach(p => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", "5");
        circle.setAttribute("fill", "var(--accent-cyan)");
        circle.setAttribute("stroke", "var(--bg-primary)");
        circle.setAttribute("stroke-width", "2");
        circle.className = 'dynamic-plot-element';
        circle.style.cursor = 'pointer';
        
        circle.addEventListener('mousemove', (e) => {
          showChartTooltip(e, p.label, p.value);
        });
        circle.addEventListener('mouseout', hideChartTooltip);
        svg.appendChild(circle);
        
        // X-label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", p.x);
        label.setAttribute("y", plotBottom + 20);
        label.setAttribute("fill", "var(--text-secondary)");
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "10");
        label.setAttribute("font-weight", "600");
        label.setAttribute("font-family", "var(--font-sans)");
        label.className = 'dynamic-plot-element';
        label.textContent = p.label;
        svg.appendChild(label);
      });
    }
  }

  function ensureSvgGradients(svg) {
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.appendChild(defs);
    }
    
    if (!document.getElementById('data-bar-gradient')) {
      const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      grad.setAttribute("id", "data-bar-gradient");
      grad.setAttribute("x1", "0");
      grad.setAttribute("y1", "1");
      grad.setAttribute("x2", "0");
      grad.setAttribute("y2", "0");
      
      const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", "rgba(56, 189, 248, 0.2)");
      
      const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", "var(--accent-cyan)");
      
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
    }
    
    if (!document.getElementById('data-line-area-gradient')) {
      const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
      grad.setAttribute("id", "data-line-area-gradient");
      grad.setAttribute("x1", "0");
      grad.setAttribute("y1", "0");
      grad.setAttribute("x2", "0");
      grad.setAttribute("y2", "1");
      
      const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", "rgba(56, 189, 248, 0.35)");
      
      const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", "rgba(56, 189, 248, 0)");
      
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
    }
  }

  function showChartTooltip(e, label, value) {
    if (!dataChartTooltipEl) return;
    const container = document.querySelector('#data-panel-sandbox .chart-workspace');
    const containerRect = container.getBoundingClientRect();
    
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    dataChartTooltipEl.style.left = `${x + 15}px`;
    dataChartTooltipEl.style.top = `${y - 45}px`;
    
    const formattedVal = typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : value;
    dataChartTooltipEl.innerHTML = `<strong>${label}</strong><br><span style="color:var(--accent-cyan);">$${formattedVal}</span>`;
    dataChartTooltipEl.classList.remove('hidden');
  }

  function hideChartTooltip() {
    if (dataChartTooltipEl) {
      dataChartTooltipEl.classList.add('hidden');
    }
  }

  // Chart Type toggles
  document.querySelectorAll('#data-forge .chart-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#data-forge .chart-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dataChartType = btn.dataset.type;
      
      // Re-render chart if we already have data
      if (currentChartData) {
        renderDataAnalysisChart(currentChartData);
      }
    });
  });

  // Pre-load default template
  dataCodeTextarea.value = dataTemplates['data-avg'];
  updateDataLineNumbers(dataTemplates['data-avg']);
  highlightExplorerTable('data-avg');

  // Trigger auto sync on startup
  runAutoSync();

});

