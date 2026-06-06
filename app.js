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
    currentSelectedTopic: 'variables',
    quizCurrentQuestionIndex: 0,
    quizScore: 0,
    quizAnswers: [],
    visScenario: 'vis-vars',
    visStep: 0,
    activeLessonTab: 'read', // 'read', 'slides', or 'video'
    slideIndex: 0
  };

  const XP_LEVELS = {
    novice: 0,
    craftsman: 100,
    scholar: 250,
    architect: 500
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
      state.unlockedPhases = [1, 2, 3, 4];
    } else if (state.xp >= XP_LEVELS.scholar) {
      badge = 'Scholar';
      state.unlockedPhases = [1, 2, 3];
    } else if (state.xp >= XP_LEVELS.craftsman) {
      badge = 'Craftsman';
      state.unlockedPhases = [1, 2];
    }
    
    state.currentBadge = badge;
    badgeVal.textContent = badge;
    
    // Dynamically unlock Phase cards in UI
    for (let i = 1; i <= 4; i++) {
      const card = document.getElementById(`phase-${i}`);
      if (card) {
        if (state.unlockedPhases.includes(i)) {
          card.classList.add('active');
          card.querySelectorAll('.roadmap-step').forEach(step => {
            step.querySelector('.step-circle').innerHTML = i === 1 && step.dataset.topic === 'variables' ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-circle"></i>';
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
    variables: {
      phase: 'Phase 1 • Spark',
      title: 'Variables & Reference Models',
      desc: '<p>In Python, variables are <strong>not storage boxes</strong>. They are simple <strong>labels (bindings)</strong> that point to objects on the memory heap.</p><p>When you execute <code>a = [1, 2]</code>, Python allocates the list object in the Heap space, and binds the name label <code>a</code> to it in the Stack namespace.</p><h4>Crucial Insight:</h4><p>If you set <code>b = a</code>, no copy of the list is made. Both <code>a</code> and <code>b</code> refer to the same list. Mutating one immediately affects the other.</p>',
      code: 'a = [1, 2]\nb = a\na.append(3)\nprint("a:", a)\nprint("b:", b) # b is also modified!',
      videoId: 'kqtD5dpn9C8'
    },
    structures: {
      phase: 'Phase 1 • Spark',
      title: 'Core Data Structures',
      desc: '<p>Python features extremely versatile built-in collections: Lists (ordered, mutable), Tuples (ordered, immutable), Dictionaries (key-value hash maps), and Sets (unordered, unique values).</p><p>Understanding their mutability is key. Lists can grow/shrink, while Tuples are frozen upon creation and are frequently used to ensure data integrity.</p>',
      code: 'my_list = [10, 20]\nmy_tuple = (10, 20)\nmy_dict = {"name": "Python", "version": 3.10}\n\n# Tuples cannot be modified:\n# my_tuple[0] = 99 -> Raises TypeError!',
      videoId: 'W8KRzm-HUcc'
    },
    loops: {
      phase: 'Phase 1 • Spark',
      title: 'Control Loops & Iterators',
      desc: '<p>Loops in Python use the Iterator Protocol under the hood. Using <code>for x in container</code> calls <code>iter(container)</code>, retrieving an iterator object, and calls <code>__next__()</code> until it raises a <code>StopIteration</code> exception.</p><h4>Range Functionality:</h4><p>The <code>range(start, stop, step)</code> function does not create a full list in memory. Instead, it generates integers on demand, making it incredibly memory efficient.</p>',
      code: 'for i in range(1, 4):\n    print(f"Forge Loop Step: {i}")',
      videoId: 'dHANJ4l6fwA'
    },
    functions: {
      phase: 'Phase 2 • Build',
      title: 'Functions & Execution Scope',
      desc: '<p>Functions are <strong>first-class citizens</strong> in Python. This means they can be passed as arguments, returned from other functions, and bound to variable names.</p><p>Python searches scopes using the <strong>LEGB Rule</strong>: <strong>L</strong>ocal -> <strong>E</strong>nclosing -> <strong>G</strong>lobal -> <strong>B</strong>uilt-in. If you want to modify a variable outside the current scope, you must explicitly declare it with <code>global</code> or <code>nonlocal</code>.</p>',
      code: 'def outer_function():\n    msg = "Enclosing Scope"\n    def inner_function():\n        nonlocal msg\n        msg = "Mutated Enclosing Scope"\n    inner_function()\n    print(msg)\nouter_function()',
      videoId: 'u-OMNv_LYRA'
    },
    comprehensions: {
      phase: 'Phase 2 • Build',
      title: 'Comprehension Syntaxes',
      desc: '<p>Comprehensions provide a concise way to create lists, dictionaries, or sets from iterable objects. They are faster than standard <code>for</code> loops because they are optimized in C-level bytecode.</p>',
      code: 'numbers = [1, 2, 3, 4, 5]\nsquares = [x**2 for x in numbers if x % 2 != 0]\nprint("Odd squares:", squares)',
      videoId: '3dt4OGnU5sM'
    },
    exceptions: {
      phase: 'Phase 2 • Build',
      title: 'Exception Propagation',
      desc: '<p>Exceptions propagate up the call stack. If they are not caught inside a <code>try/except</code> block, the execution stops, and Python prints a traceback detailing the error chain.</p>',
      code: 'def safe_divide(x, y):\n    try:\n        return x / y\n    except ZeroDivisionError:\n        return "Error: Division by zero!"\nprint(safe_divide(10, 0))',
      videoId: '6SPDvPK38es'
    },
    classes: {
      phase: 'Phase 3 • Architect',
      title: 'Classes & Instantiation',
      desc: '<p>Object-Oriented Programming (OOP) lets you bundle behavior and data together. In Python, a class defines the blueprint, and an instance represents the physical object loaded in memory.</p><p>When an instance is created, <code>__new__</code> allocates the memory, and then <code>__init__</code> initializes the attributes.</p>',
      code: 'class Wizard:\n    def __init__(self, name):\n        self.name = name\n    def cast(self):\n        return f"{self.name} casts Fireball!"\n\nmerlin = Wizard("Merlin")\nprint(merlin.cast())',
      videoId: 'wFcDGy_G6dM'
    },
    dunders: {
      phase: 'Phase 3 • Architect',
      title: 'Dunder (Magic) Methods',
      desc: '<p>Double-underscore (dunder) methods allow you to hook your classes into standard Python operations. Implementing <code>__str__</code> alters string representation, while <code>__len__</code> implements the behavior of <code>len(obj)</code>.</p>',
      code: 'class Cart:\n    def __init__(self, items):\n        self.items = items\n    def __len__(self):\n        return len(self.items)\n\nmy_cart = Cart(["book", "pen"])\nprint("Cart item count:", len(my_cart))',
      videoId: '3ohzBxoFHAY'
    },
    inheritance: {
      phase: 'Phase 3 • Architect',
      title: 'MRO & Class Inheritance',
      desc: '<p>Python supports multiple inheritance. It uses the <strong>Method Resolution Order (MRO)</strong> computed via the C3 Linearization algorithm to determine the order in which base classes are searched for attributes.</p>',
      code: 'class A: pass\nclass B(A): pass\nprint("MRO of B:", B.__mro__)',
      videoId: 'Cn7AkDb9A70'
    },
    decorators: {
      phase: 'Phase 4 • Scale',
      title: 'Decorators & Closures',
      desc: '<p>A decorator is a function that takes another function as an argument, adds some functional extension, and returns a modified function wrapper.</p><p>This relies on **Closures** - nested functions that retain reference to variable bindings from their enclosing lexical scopes even after the outer function has completed execution.</p>',
      code: 'def bold_decorator(func):\n    def wrapper():\n        return "<b>" + func() + "</b>"\n    return wrapper\n\n@bold_decorator\ndef hello():\n    return "Hello"\nprint(hello())',
      videoId: 'FsAPt_9BdxU'
    },
    generators: {
      phase: 'Phase 4 • Scale',
      title: 'Generators & Yield Statements',
      desc: '<p>Generators compile into iterator functions containing the <code>yield</code> keyword. Unlike functions that return a value and destroy their stack space, generators freeze their state and return control, resuming right where they left off when requested.</p>',
      code: 'def fibonacci(limit):\n    a, b = 0, 1\n    for _ in range(limit):\n        yield a\n        a, b = b, a + b\n\nprint(list(fibonacci(5)))',
      videoId: 'tmeK5Gef5XA'
    },
    context: {
      phase: 'Phase 4 • Scale',
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
    { id: "kqtD5dpn9C8", phase: "spark", title: "Variables & Reference Models", desc: "A detailed breakdown of variable bindings, tags, stack bindings, and mutability.", duration: "12:15" },
    { id: "W8KRzm-HUcc", phase: "spark", title: "Mastering Lists, Tuples & Dicts", desc: "Explore collections scoping, hash mapping, lists, sets, and tuple safety.", duration: "18:40" },
    { id: "dHANJ4l6fwA", phase: "spark", title: "Control Flows & Loops", desc: "How python iterators trigger list loops and evaluate conditions.", duration: "14:20" },
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
    vars: `x = 42\ny = x\nx = 99\n\nprint("x is:", x)\nprint("y is:", y)`,
    comprehension: `nums = [1, 2, 3, 4, 5]\nevens_squared = [x**2 for x in nums if x % 2 == 0]\n\nprint("Evens squared list:", evens_squared)`,
    'class-oop': `class ForgeMember:\n    def __init__(self, name, xp):\n        self.name = name\n        self.xp = xp\n    def get_info(self):\n        return f"Member {self.name} has {self.xp} XP!"\n\nmember = ForgeMember("Archimedes", 250)\nprint(member.get_info())`,
    'decorator-timer': `def py_forge_decorator(func):\n    def wrapper():\n        print("[Decorator] Intercepting execution...")\n        func()\n        print("[Decorator] Execution completed.")\n    return wrapper\n\n@py_forge_decorator\ndef launch():\n    print("Executing core function launch.")\n\nlaunch()`
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

  function executePythonCode(code) {
    clearTerminal();
    logTerminal('>>> Running script.py...', 'system');

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

});

