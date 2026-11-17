# Skillverse — Mentor Presentation & Video Voice-Over Script

This document accompanies the interactive video presentation located at [`showcase-video-presentation.html`](./showcase-video-presentation.html).

---

## 🎥 Quick Start: How to Record the Video for Your Mentor

1. **Open the presentation:**
   - Double-click [`showcase-video-presentation.html`](./showcase-video-presentation.html) in your browser (Google Chrome or Microsoft Edge recommended).
2. **Press Fullscreen:**
   - Click the **⛶ Fullscreen** button (or press `F11`).
3. **Start Screen Recording:**
   - On Windows, press <kbd>Win</kbd> + <kbd>Alt</kbd> + <kbd>R</kbd> (or <kbd>Win</kbd> + <kbd>G</kbd>) to start recording via the Windows Game Bar.
   - Alternatively, use OBS Studio or any screen recorder.
4. **Voice-Over Options:**
   - **Option A (AI Auto-Voice):** Keep `Auto-Voice: ON` enabled. The browser will automatically speak the script in synchronization with each slide!
   - **Option B (Your Own Voice):** Toggle `Auto-Voice: OFF` and read the verbatim script below into your microphone as the slides advance.
5. **Stop Recording:**
   - Press <kbd>Win</kbd> + <kbd>Alt</kbd> + <kbd>R</kbd> to save your `.mp4` video.

---

## 🎙️ Verbatim Voice-Over Script (Scene by Scene)

### Scene 1: Project Overview & Vision (0:00 - 0:16)
> *"Hello Sir/Ma'am. Welcome to the demonstration of Skillverse, our 5th-semester mini project. Skillverse is an adaptive, gamified web platform built specifically for neurodivergent children aged 6 to 17. It bridges cognitive skill building, socio-emotional learning, and parental oversight into a safe, accessible desktop experience."*

---

### Scene 2: System Architecture & Engineering Stack (0:16 - 0:33)
> *"On the engineering side, Skillverse is architected as a decoupled, multi-tier system. The frontend runs on Next.js 16 with the Turbopack engine, delivering accessible, WCAG AA compliant interfaces with custom soundscapes. The backend is powered by NestJS with Prisma ORM and SQLite, featuring strict schema constraints, dual JWT security tiers, and eight domain modules."*

---

### Scene 3: Guardian Onboarding & 19-Parameter Sensory Profiling (0:33 - 0:50)
> *"Before a child begins, guardians complete an intake assessment covering nineteen distinct parameters: sound sensitivity, motion comfort, attention span, and regulation habits. The backend algorithmically derives difficulty baselines and UI configurations directly from these answers, guaranteeing that a child with sensory sensitivities is never overwhelmed."*

---

### Scene 4: AI Companion System & Emotional Zone Check-Ins (0:50 - 1:07)
> *"A key innovation in Skillverse is the AI Companion system. Children adopt virtual companions that evolve across four developmental tiers as they progress. Furthermore, the ubiquitous Heart Button allows one-click check-ins across four emotional zones: Blue, Green, Yellow, and Red, offering calming interventions and recording telemetry for parents."*

---

### Scene 5: Universal Theme System & Sensory Accommodations (1:07 - 1:23)
> *"Neurodivergent learners often suffer sensory fatigue from flashy graphics. Skillverse addresses this with three immersive, accessible themes: Space, Ocean, and Jungle. Built with CSS custom properties, it includes instant toggles for Calm Mode, Dark Mode, and low-frequency auditory chimes."*

---

### Scene 6: Explorer Hub Shell & Daily Journey Quests (1:23 - 1:39)
> *"The Hub Shell serves as the primary home screen. It hosts the child's daily quest journey, seamlessly uniting mini-game challenges with real-life habit tracking configured by parents. Level progression is strictly non-punitive: kids earn stars and level up, but never lose points or experience anxiety-inducing countdown timers."*

---

### Scene 7: Mini-Game 1 — Launch Challenge (Time World) (1:39 - 1:56)
> *"Now let's examine the mini-games. The first game, Launch Challenge in Time World, tackles time blindness. Through three difficulty tiers, children practice reading clock hands, distinguishing morning versus evening sequences, and estimating activity durations to launch their rockets."*

---

### Scene 8: Mini-Games 2 & 3 — Volcano Scale & Face Detective (1:56 - 2:13)
> *"The second and third games train emotional intelligence. Volcano Scale guides children to measure their frustration on a 1-to-5 thermometer and select a de-escalation strategy before the volcano erupts. In Faces World, Face Detective uses stylized avatar clues to teach facial cues and social empathy."*

---

### Scene 9: Dynamic Adaptive Difficulty Engine (2:13 - 2:30)
> *"Our adaptive difficulty engine ensures games stay engaging without inducing anxiety. Following a 3-consecutive-win algorithm, tasks dynamically scale in complexity. Crucially, if frustration or distress is detected, the system immediately steps down the difficulty, refunds participation stars, and invites the child to rest."*

---

### Scene 10: Micro-Economy, Avatar Shop & Win Gallery (2:30 - 2:47)
> *"Module 9 implements a closed, zero-inflation economy. Children earn stars for experience and spendable coins for completing activities. In the Avatar Shop, they can customize their avatar face and purchase hats, shirts, and accessories. Milestone badges and collectibles are stored in the Win Gallery, fostering positive reinforcement."*

---

### Scene 11: Guardian Mission Control & Telemetry (2:47 - 3:04)
> *"The Guardian Dashboard offers parents comprehensive oversight. Protected by a dedicated password gate, it aggregates a rolling 7-day mission report displaying playtime, emotional zone distributions, and game session telemetry. It also enforces bedtime quiet hours and provides one-click COPPA data export."*

---

### Scene 12: Conclusion & Academic Impact (3:04 - 3:22)
> *"In conclusion, Skillverse successfully delivers all eleven specified architectural modules. By harmonizing neurodivergent-friendly UI design, dynamic difficulty adaptation, and clinical guardian reporting, the project proves that digital learning can be both delightfully engaging and psychologically therapeutic. Thank you for your time and mentorship."*

---

## 💡 Potential Mentor Questions & How to Answer

1. **"Why SQLite instead of PostgreSQL or MongoDB?"**
   - *Answer:* "SQLite with WAL mode and Prisma ORM provides strict ACID guarantees, ultra-fast zero-latency embedded queries, and full referential integrity. In production, Prisma allows seamless migration to PostgreSQL by simply switching the connection string."
2. **"How does the difficulty adaptation work in code?"**
   - *Answer:* "The initial difficulty tier is derived from the guardian's Q4 intake answer. During gameplay, `useDifficultyProfile.ts` monitors outcomes. When 3 consecutive perfect scores occur, `PATCH /difficulty/:gameId` escalates the tier. If 2 consecutive errors or an early exit happen, the tier drops immediately and refunded stars are credited."
3. **"How is privacy and data compliance handled?"**
   - *Answer:* "Skillverse complies with COPPA principles: guardians must verify their status, child accounts do not require emails or phone numbers, passwords are protected by bcrypt, sessions use HttpOnly cookies, and guardians have full rights to JSON export and permanent cascade deletion."
