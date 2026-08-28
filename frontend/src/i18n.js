import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // LOGIN AND ACCESS
      "login": {
        "welcome": "Welcome to SmartStudy",
        "welcome_text": "Study smarter, not harder",
        "description": "You do not need an email address or any other \npersonal information to use the platform.",

        "new_session": "Start new participation",
        "existing_session": "Continue participation",

        "create_title": "New pseudonymous session",
        "create_description": "A random user identifier and access code will be created. \nThey are only used to continue the study.",
        "create_button": "Create access",

        "access_ready": "Your access is ready",
        "save_data": "Save your user identifier and access code. \nThey will only be shown once.",
        "user_id": "User identifier",
        "access_code": "Access code",
        "copy": "Copy details",
        "copied": "Copied",
        "continue": "Continue",

        "login_title": "Continue participation",
        "login_description": "Enter the user identifier and access code \nyou received during your first visit.",
        "user_id_placeholder": "User identifier",
        "access_code_placeholder": "Access code",

        "login_button": "Sign in",
        "back": "Back",

        "missing_credentials": "Enter your user identifier and access code.",
        "invalid_credentials": "The provided credentials are invalid.",
        "general_error": "Something went wrong. Please try again.",

        "support_title": "Questions or technical issues?"
      },

      // GENERAL USER INTERFACE
      "error_loading_content": "Content could not be loaded.",
      "error_server_unavailable": "Content is not ready yet or the server is unreachable.",
      "back_to_dashboard": "Back to Dashboard",
      "loading_lesson": "Preparing lesson content and mind map...",
      "zoom": "Zoom",
      "dashboard": "Dashboard",
      "visual_summary": "Visual Topic Summary",
      "zoom_in": "Zoom In",
      "back_to_learning": "Back to Learning",
      "lesson_completed": "Lesson Completed!",
      "exam_goal_quiz_hint": "This lesson emphasizes reinforcing key information and checking understanding.",
      "quiz_result": "Quiz Result",
      "review_material": "Review Material",
      "finish_research": "Finish research",
      "interaction": "Interaction",
      "summary": "Summary",
      "visualization": "Visualization",
      "quiz": "Quiz",
      "logout": "Logout",
      "mode": "Mode",

      // DASHBOARD AND CONTENT LIBRARY
      "dashboard_title": "What do you want to learn?",
      "dashboard_subtitle": "Search for a topic to explore existing lessons or use artificial intelligence to create a new personalized study experience.",
      "dashboard_subtitle_2.0": "Find the desired topic among existing lessons.",
      "library_title": "Content Library",
      "library_subtitle": "Explore existing lessons.",
      "loading_library": "Loading library...",
      "lesson_card_desc": "Explore the learning content for this topic.",
      "open_lesson": "Open",
      "add_new_topic_hint": "Add a new topic above!",
      "no_title": "No title",
      "unknown_topic": "Unknown topic",
      "search_placeholder": "What do you want to learn? (e.g. Black holes, Red pandas...)",
      "explore_button": "Explore",
      "generating_message": "Checking existing content and preparing the lesson ...",
      "error_generating": "An error occurred while generating content.",
      "loading_message": "SmartStudy system is preparing...",

      // FOOTER
      "footer_contact": "Questions or issues?",
      "all_rights_reserved": "All rights reserved",

      // PRIVACY AND ADAPTATION SETTINGS
      "privacy_title": "Privacy",
      "privacy_note": "The system uses interaction data, such as clicks and reading time, to adapt the learning experience. It does not use sensitive personal data.",
      "adaptation_controls_title": "Adaptation controls",
      "disable_adaptation": "Disable adaptation",
      "enable_adaptation": "Enable adaptation",
      "visual_mode": "Visual mode",
      "verbal_mode": "Verbal mode",
      "glossary_of_terms": "Glossary of terms",
      "practical_examples": "Practical examples",
      "why_am_i_seeing_this": "Why am I seeing this?",
      "why_explanation_title": "Adaptation explanation",
      "content_mode_title": "Content display mode",
      "adaptation_explanation_visual": "The system currently prioritizes the visual presentation based on your settings and interactions during use.",
      "adaptation_explanation_verbal": "The system currently prioritizes the text-based presentation based on your settings and interactions during use.",
      "adaptation_explanation_short": "The system continuously adapts the presentation of the learning content based on your settings and interactions during use.",

      // CONTENT GENERATION MESSAGES
      "daily_generation_limit_title": "Choose a topic from the library",
      "daily_generation_limit_line1": "To continue, please select one of the topics from the library.",
      "daily_generation_limit_line2": "Several ready-made lessons are available for exploration.",
      "generation_unavailable": "Lesson generation is currently unavailable",
      "generation_retry_line1": "The lesson could not be generated at the moment.",
      "generation_retry_line2": "Please try again.",
      "generation_use_existing_line1": "Lesson generation is temporarily unavailable.",
      "generation_use_existing_line2": "Please choose one of the existing learning topics.",
      "understand": "I understand",
      "generation_failed_title": "Lesson generation failed",
      "try_again": "Try again",

      // LESSON RECOMMENDATIONS
      "recommended_next_lesson": "Recommended next lesson",
      "loading_recommendation": "Loading recommendation...",
      "open_recommended_lesson": "Open recommended lesson",
      "no_recommendation_available": "No recommendation is currently available.",
      "skip_recommendation": "Skip recommendation",
      "recommendations_disabled": "Recommendations are temporarily disabled because you skipped them.",
      "enable_recommendations": "Enable recommendations again",

      // RESEARCH CONSENT
      "consent": {
        "label": "SmartStudy",
        "title": "Research Participation Consent",
        "desc": "The SmartStudy platform is part of a master's thesis research study. The study involves using the platform to explore learning content and completing a final questionnaire. The estimated participation time is approximately 8–10 minutes.",
        "note": "During platform use, interaction data, quiz results, and final questionnaire responses are collected. The data are linked only to a randomly generated pseudonymous user identifier and do not contain an email address or other direct personal identifiers. The collected data will be used exclusively for the purposes of this master's thesis research. Only the researcher has access to the collected data. Participation is voluntary and you may withdraw at any time by deleting your research data.",
        "retention": "The collected data will be retained until the research and the master's thesis defense have been completed, and no later than 31 October 2026, after which they will be permanently deleted or anonymized.",
        "button": "I Agree and Continue",
        "error": "Consent could not be saved. Please try again."
      },

      // PARTICIPATION INSTRUCTIONS
      "instructions": {
        "title": "Participation Instructions",
        "text": "Explore the learning content in the way that suits you best. You can use summaries, definitions, examples, visualizations, and quizzes.",
        "note": "To complete the study, finish 3 learning topics and their quizzes. The final questionnaire will then be unlocked. Estimated participation time is approximately 8–10 minutes.",        "button": "I Understand",
        "error": "The instructions could not be marked as read. Please try again."
      },

      // INITIAL PROFILE
      "profile": {
        "header_title": "Initial Information",
        "header_description": "Answer a few short questions before using the platform.",
        "initial_profile": "Initial Profile",
        "title": "Before You Begin",
        "description": "Answer a few short questions before using the platform.",
        "age": "Age",
        "select": "Select",
        "age_18_19": "18-19",
        "age_20_24": "20–24",
        "age_25_29": "25–29",
        "age_30_plus": "30 or more",
        "ai_usage": "How often do you use AI tools for obtaining information, learning, or personal development?",
        "never": "Never",
        "rarely": "Rarely",
        "sometimes": "Sometimes",
        "often": "Often",
        "very_often": "Very often",
        "learning_goal": "What is usually most important to you when exploring new information?",
        "goal_quick": "Getting a quick overview",
        "goal_deep": "Building an in-depth understanding",
        "goal_exam": "Reinforcing key information",
        "goal_revision": "Refreshing existing knowledge",
        "error_incomplete": "Please complete the initial questions."
      },

      // LEARNING STYLE QUESTIONNAIRE
      "style_quiz": {
        "title": "Your presentation preference",
        "description": "Answer the questions below about your preferred way of presenting learning content.",
        "q1": "When I think about what I have learned, a picture, chart, or diagram is the first thing that comes to mind.",
        "q2": "I understand a topic better when it is explained through written text rather than visual representations.",
        "q3": "I often draw sketches, diagrams, or mind maps while studying.",
        "q4": "I remember written explanations and definitions more easily than visual representations.",
        "q5": "I understand complex systems better when they are presented with a graphical model or diagram.",
        "q6": "Notes in the form of bullet points and structured text are most effective for me.",
        "submit": "Determine my preference",
        "tie_title": "Both presentation modes suit you equally.",
        "tie_description": "Your responses indicate an equal preference for both presentation modes. Please select the one you generally prefer.",
        "tie_visual": "Visual presentation",
        "tie_verbal": "Text-based presentation",
        "saving": "Saving your choice ..."
      },

      // LESSON, QUIZ AND VISUALIZATION
      "loading_quiz": "Composing questions...",
      "quiz_unavailable": "Quiz for this lesson is currently unavailable.",
      "quiz_question": "Question",
      "check_answer": "Check Answer",
      "next_question": "Next Question",
      "finish_quiz": "Finish Quiz",
      "loading_visual": "Preparing visualization...",
      "visual_error_title": "Visualization Error",
      "visual_error_desc": "The diagram could not be rendered. Try refreshing.",
      "lessons_progress": "You completed {{count}} out of {{total}} lessons. Continue learning.",
      "survey_unlocked": "You completed 3 lessons. The final questionnaire is now available.",
      "open_survey": "Open questionnaire",
      "back_generic": "Back",
      "next_generic": "Next",

      // REVIEW SUGGESTIONS
      "adaptive_review_title": "Review suggestion",
      "adaptive_review_text_visual": "Based on your quiz result, we recommend reviewing the visual representation.",
      "adaptive_review_text_verbal": "Based on your quiz result, we recommend reviewing the summary.",
      "open_summary": "Open summary",
      "open_visualization": "Open visualization",
      "skip_review_suggestion": "Skip suggestion",

      // ADAPTIVE USER INTERFACE
      "adaptive_visual_hidden": "Visual summary is hidden to help you focus on the text.",
      "show_visual_summary": "Show visual summary",
      "show_anyway": "Show anyway",
      "adaptive_highlight_explanation": "We highlighted key information that may help you quickly review the learning content.",

      // FINAL QUESTIONNAIRE
      "survey": {
        "title": "Final Questionnaire",
        "subtitle": "Your feedback is essential for the research part of this master’s thesis.",
        "sus_trust_privacy_acceptance": "EVALUATION OF THE SMARTSTUDY PLATFORM",

        "scale_left": "Strongly disagree",
        "scale_right": "Strongly agree",

        "submit": "SUBMIT RESPONSES",
        "sending": "Submitting...",

        "error_incomplete": "Please answer all questions before submitting the questionnaire.",
        "error_submit": "Something went wrong while submitting. Please try again.",
        "error_not_logged_in": "You must be signed in to submit the questionnaire.",

        // System Usability Scale
        "sus1": "I think that I would like to use this system frequently.",
        "sus2": "I found the system unnecessarily complex.",
        "sus3": "I thought the system was easy to use.",
        "sus4": "I think that I would need the support of a technical person to be able to use this system.",
        "sus5": "I found the various functions in this system were well integrated.",
        "sus6": "I thought there was too much inconsistency in this system.",
        "sus7": "I would imagine that most people would learn to use this system very quickly.",
        "sus8": "I found the system very cumbersome to use.",
        "sus9": "I felt very confident using the system.",
        "sus10": "I needed to learn a lot of things before I could get going with this system.",

        // Trust
        "trust1": "I am confident in the SmartStudy platform.",
        "trust2": "The SmartStudy platform is reliable.",
        "trust3": "I can trust the SmartStudy platform.",

        // Perceived data collection and use transparency
        "privacy1": "It was clear to me what data the SmartStudy platform collects during my use.",
        "privacy2": "It was clear to me for what purpose the SmartStudy platform collects data during my use.",
        "privacy3": "It was clear to me how the SmartStudy platform uses the data collected during my use.",

        // Acceptance
        "acceptance1": "I intend to use SmartStudy in the future.",
        "acceptance2": "I predict that I would use SmartStudy in the future.",
        "acceptance3": "I plan to use SmartStudy for future learning.",

        // Perceived personalization
        "perceivedPersonalization1": "The SmartStudy platform took my needs into account when presenting the learning content.",
        "perceivedPersonalization2": "The SmartStudy platform took my preferences regarding the way the learning content was presented into account.",
        "perceivedPersonalization3": "I felt that the presentation of the learning content on the SmartStudy platform was personalized to me.",

        // Perceived adaptation
        "adaptation_notice": "I noticed that the platform adapted its behavior during learning based on my interactions."
      },

      // RESEARCH COMPLETION
      "thank_you_title": "Thank you for participating!",
      "thank_you_desc": "Your responses have been saved successfully. Click “Finish research” to complete your participation and sign out.",
      "research_completed": {
        "title": "Research completed",
        "description": "Thank you for participating in the SmartStudy research."
      },

      // LEARNING COACH
      "coach_title": "Learning Coach",
      "coach_subtitle": "Personalized guidance for this lesson",
      "coach_why_title": "Why this layout?",
      "coach_why_visual": "The current display is optimized for a visual presentation. The system prioritizes diagrams and a structured layout.",
      "coach_why_verbal": "The current display is optimized for a text-based presentation. The system prioritizes clear text and focused reading.",
      "coach_next_title": "Suggested next step",
      "coach_next_visual": "Start with the mind map to build a mental structure, then read the text for details.",
      "coach_next_verbal": "Read the lesson carefully first. Use key terms as anchors, then take the quiz.",
      "coach_next_reveal_visual": "Want a quick overview? You can reveal the visual summary at any time.",
      "opened": "Opened",

      "takeaways_title": "Summary",

      "next_step_visual": "You've finished the main content. Continue with the summary or the quiz.",
      "next_step_verbal": "You've finished the main content. Continue with the visualization or the quiz.",
      "visual_summary_available": "A visual summary is also available.",

      "summary_available": "A text summary is available.",
      "show_summary": "Show summary",

      "reading_completed_toast": "You reached the end of the lesson. We recommend a next step.",

      // DISPLAY MODE EXPLANATIONS
      "display_mode_change_visual": "The current display places greater emphasis on a visual overview and faster understanding of the learning content.",
      "display_mode_change_verbal": "The current display places greater emphasis on detailed explanations and focused reading of the learning content.",

      // LEARNING GOAL EXPLANATIONS
      "learning_goal_short_quick_understanding": "Because a quick overview is important to you, the key information is presented in a more concise format.",
      "learning_goal_short_deep_understanding": "Because gaining an in-depth understanding is important to you, the lesson focuses on detailed explanations and additional examples.",
      "learning_goal_short_exam_preparation": "Because reinforcing key information is important to you, greater emphasis is placed on essential concepts and checking understanding.",
      "learning_goal_short_revision": "Because refreshing existing knowledge is important to you, the lesson focuses on a quick review of the most important information.",

      // PRESENTATION MODE SWITCHING
      "style_switch_title": "Adaptation Suggestion",
      "style_switch_question_visual": "Would you like to switch to the visual presentation mode?",
      "style_switch_question_verbal": "Would you like to switch to the text-based presentation mode?",
      "style_switch_text_visual": "We noticed that you frequently open visual representations. Based on your interactions, the system suggests a visual content presentation mode.",
      "style_switch_text_verbal": "We noticed that you frequently open summaries. Based on your interactions, the system suggests a verbal content presentation mode.",
      "switch_to_visual": "Switch to Visual Mode",
      "switch_to_verbal": "Switch to Verbal Mode",
      "keep_current_style": "Keep Current Mode",

      // RESEARCH WITHDRAWAL
      "withdrawal": {
        "open": "Withdraw participation",
        "title": "Withdraw participation",
        "description": "Withdrawing from the study will delete your user profile and all research data associated with your identifier.",
        "warning": "This action cannot be undone. After deletion, you will no longer be able to sign in using your current identifier and access code.",
        "cancel": "Go back",
        "confirm": "Delete my data",
        "deleting": "Deleting ...",
        "delete_error": "An error occurred while deleting your data. Please try again."
      }
    }
  },

  sl: {
    translation: {
      // PRIJAVA IN DOSTOP
      "login": {
        "welcome": "Dobrodošli v SmartStudy",
        "welcome_text": "Uči se pametneje, ne težje",
        "description": "Za uporabo platforme ne potrebujete \ne-poštnega naslova ali drugih osebnih podatkov.",

        "new_session": "Novo sodelovanje",
        "existing_session": "Nadaljuj sodelovanje",

        "create_title": "Nova psevdonimna seja",
        "create_description": "Ustvarili bomo naključni identifikator uporabnika in dostopno kodo. Podatki bodo uporabljeni samo za nadaljevanje raziskave.",
        "create_button": "Ustvari dostop",

        "access_ready": "Dostop je pripravljen",
        "save_data": "Shranite identifikator uporabnika in dostopno kodo. \nPrikazana bosta samo enkrat.",
        "user_id": "Identifikator uporabnika",
        "access_code": "Dostopna koda",
        "copy": "Kopiraj podatke",
        "copied": "Kopirano",
        "continue": "Nadaljuj",

        "login_title": "Nadaljuj sodelovanje",
        "login_description": "Vnesite identifikator uporabnika in dostopno kodo, \nki ste ju prejeli ob prvem obisku.",
        "user_id_placeholder": "Identifikator uporabnika",
        "access_code_placeholder": "Dostopna koda",

        "login_button": "Prijava",
        "back": "Nazaj",

        "missing_credentials": "Vnesite identifikator uporabnika in dostopno kodo.",
        "invalid_credentials": "Vneseni podatki niso pravilni.",
        "general_error": "Prišlo je do napake. Poskusite znova.",

        "support_title": "Vprašanja ali tehnične težave?"
      },

      // SPLOŠNI UPORABNIŠKI VMESNIK
      "error_loading_content": "Vsebine ni bilo mogoče naložiti.",
      "error_server_unavailable": "Vsebina še ni pripravljena ali pa strežnik ni dosegljiv.",
      "back_to_dashboard": "Nazaj na nadzorno ploščo",
      "loading_lesson": "Pripravljam vsebino lekcije in miselni vzorec...",
      "zoom": "Povečava",
      "dashboard": "Nadzorna plošča",
      "visual_summary": "Vizualni povzetek snovi",
      "zoom_in": "Povečaj",
      "back_to_learning": "Nazaj na učenje",
      "lesson_completed": "Lekcija zaključena!",
      "exam_goal_quiz_hint": "Poudarek je na utrjevanju ključnih informacij in preverjanju razumevanja.",
      "quiz_result": "Rezultat kviza",
      "review_material": "Ponovno preberi snov",
      "finish_research": "Zaključi raziskavo",
      "interaction": "Interakcija",
      "summary": "Povzetek",
      "visualization": "Vizualizacija",
      "quiz": "Kviz",
      "logout": "Odjava",
      "mode": "Način",

      // NADZORNA PLOŠČA IN KNJIŽNICA VSEBIN
      "dashboard_title": "Kaj se želiš naučiti?",
      "dashboard_subtitle": "Poišči želeno temo med obstoječimi lekcijami ali uporabi umetno inteligenco za ustvarjanje nove vsebine po tvoji meri.",
      "dashboard_subtitle_2.0": "Poišči želeno temo med obstoječimi lekcijami.",
      "library_title": "Knjižnica vsebin",
      "library_subtitle": "Razišči obstoječe lekcije.",
      "loading_library": "Nalagam knjižnico...",
      "lesson_card_desc": "Raziščite učno vsebino izbrane teme.",
      "open_lesson": "Odpri",
      "add_new_topic_hint": "Dodaj novo temo zgoraj!",
      "no_title": "Brez naslova",
      "unknown_topic": "Neznana tema",
      "search_placeholder": "Kaj se želiš učiti? (npr. Črne luknje, Rdeče pande...)",
      "explore_button": "Razišči",
      "generating_message": "Preverjam obstoječe vsebine in pripravljam učno snov ...",
      "error_generating": "Prišlo je do napake pri generiranju vsebine",
      "loading_message": "Pametni sistem SmartStudy se pripravlja...",

      // NOGA STRANI
      "footer_contact": "Vprašanja ali težave?",
      "all_rights_reserved": "Vse pravice pridržane",

      // ZASEBNOST IN NASTAVITVE PRILAGAJANJA
      "privacy_title": "Zasebnost",
      "privacy_note": "Sistem uporablja podatke o interakciji, kot so kliki in čas branja, za prilagajanje učne izkušnje. Občutljivih osebnih podatkov ne uporablja.",
      "adaptation_controls_title": "Nastavitve prilagajanja",
      "disable_adaptation": "Izklopi prilagajanje",
      "enable_adaptation": "Vklopi prilagajanje",
      "visual_mode": "Vizualni način",
      "verbal_mode": "Besedilni način",
      "glossary_of_terms": "Slovarček pojmov",
      "practical_examples": "Primeri iz prakse",
      "why_am_i_seeing_this": "Zakaj vidim to?",
      "why_explanation_title": "Razlaga prilagajanja",
      "content_mode_title": "Način prikaza vsebine",
      "adaptation_explanation_visual": "Sistem trenutno daje prednost vizualni predstavitvi na podlagi tvojih nastavitev in interakcij med uporabo platforme.",
      "adaptation_explanation_verbal": "Sistem trenutno daje prednost besedilni predstavitvi na podlagi tvojih nastavitev in interakcij med uporabo platforme.",
      "adaptation_explanation_short": "Sistem sproti prilagaja prikaz učne vsebine glede na tvoje nastavitve in interakcije med uporabo.",

      // SPOROČILA O GENERIRANJU VSEBIN
      "daily_generation_limit_title": "Izberite temo iz knjižnice",
      "daily_generation_limit_line1": "Za nadaljevanje izberite eno izmed učnih tem v knjižnici.",
      "daily_generation_limit_line2": "Na voljo je več pripravljenih vsebin za raziskovanje.",
      "generation_unavailable": "Generiranje vsebine trenutno ni na voljo",
      "generation_retry_line1": "Vsebine trenutno ni bilo mogoče pripraviti.",
      "generation_retry_line2": "Prosimo, poskusite še enkrat.",
      "generation_use_existing_line1": "Generiranje trenutno ni na voljo.",
      "generation_use_existing_line2": "Prosimo, izberite eno izmed obstoječih učnih tem.",
      "understand": "Razumem",
      "generation_failed_title": "Generiranje ni uspelo",
      "try_again": "Poskusi ponovno",

      // PRIPOROČILA LEKCIJ
      "recommended_next_lesson": "Priporočena naslednja lekcija",
      "loading_recommendation": "Nalagam priporočilo ...",
      "open_recommended_lesson": "Odpri priporočeno lekcijo",
      "no_recommendation_available": "Priporočilo trenutno ni na voljo.",
      "skip_recommendation": "Preskoči priporočilo",
      "recommendations_disabled": "Priporočila so začasno onemogočena, ker si jih preskočil/a.",
      "enable_recommendations": "Ponovno aktiviraj priporočila",

      // SOGLASJE ZA SODELOVANJE
      "consent": {
        "label": "SmartStudy",
        "title": "Soglasje za sodelovanje v raziskavi",
        "desc": "Platforma SmartStudy je del raziskave magistrske naloge. Raziskava vključuje uporabo platforme za obravnavo učnih vsebin ter izpolnitev zaključnega vprašalnika. Predviden čas sodelovanja je približno 8–10 minut.",
        "note": "Med uporabo platforme se beležijo podatki o interakcijah, rezultati kvizov in odgovori zaključnega vprašalnika. Podatki so povezani izključno z naključno ustvarjenim psevdonimnim identifikatorjem uporabnika in ne vsebujejo e-poštnega naslova ali drugih neposrednih osebnih podatkov. Zbrani podatki bodo uporabljeni izključno za namen raziskave magistrske naloge. Do podatkov ima dostop samo raziskovalka. Sodelovanje je prostovoljno in ga lahko kadarkoli prekinete ter preko možnosti za izbris podatkov umaknete svoje sodelovanje.",
        "retention": "Podatki bodo hranjeni do uspešnega zaključka raziskave in zagovora magistrske naloge oziroma najpozneje do 31. 10. 2026, nato pa bodo trajno izbrisani ali anonimizirani.",
        "button": "Strinjam se in nadaljujem",
        "error": "Soglasja ni bilo mogoče shraniti. Poskusite znova."
      },

      // NAVODILA ZA SODELOVANJE
      "instructions": {
        "title": "Navodila za sodelovanje",
        "text": "Med uporabo platforme vsebine pregledujte na način, ki vam najbolj ustreza. Uporabljate lahko povzetke, definicije, primere, vizualne prikaze in kvize.",
        "note": "Za zaključek raziskave opravite 3 učne teme in pripadajoče kvize. Nato se bo odklenil zaključni vprašalnik. Predviden čas sodelovanja je približno 8–10 minut.",        "button": "Razumem",
        "error": "Navodil trenutno ni bilo mogoče označiti kot prebranih. Poskusite znova."
      },

      // ZAČETNI PROFIL
      "profile": {
        "header_title": "Začetni podatki",
        "header_description": "Odgovorite na kratka vprašanja pred začetkom uporabe platforme.",
        "initial_profile": "Začetni profil",
        "title": "Pred začetkom uporabe",
        "description": "Odgovorite na kratka vprašanja pred začetkom uporabe platforme.",
        "age": "Starost",
        "select": "Izberite",
        "age_18_19": "18-19",
        "age_20_24": "20–24",
        "age_25_29": "25–29",
        "age_30_plus": "30 ali več",
        "ai_usage": "Kako pogosto uporabljate AI orodja za pridobivanje informacij, učenje ali osebni razvoj?",
        "never": "Nikoli",
        "rarely": "Redko",
        "sometimes": "Občasno",
        "often": "Pogosto",
        "very_often": "Zelo pogosto",
        "learning_goal": "Kaj vam je pri pridobivanju novih informacij običajno najpomembnejše?",
        "goal_quick": "Hiter pregled bistva",
        "goal_deep": "Poglobljeno razumevanje",
        "goal_exam": "Utrjevanje ključnih informacij",
        "goal_revision": "Osvežitev že znanih informacij",
        "error_incomplete": "Prosimo, izpolnite začetna vprašanja."
      },

      // VPRAŠALNIK O NAČINU UČENJA
      "style_quiz": {
        "title": "Vaša preferenca načina predstavitve",
        "description": "Odgovorite na spodnja vprašanja o vaši preferenci načina predstavitve učne vsebine.",
        "q1": "Ko razmišljam o tem, kar sem se naučil/a, mi najprej pride na misel slika, graf ali diagram.",
        "q2": "Temo bolje razumem, kadar je razložena z besedilom kot pa z vizualnimi prikazi.",
        "q3": "Med učenjem pogosto rišem skice, diagrame ali miselne vzorce.",
        "q4": "Pisne razlage in definicije si zapomnim lažje kot vizualne prikaze.",
        "q5": "Zapletene sisteme bolje razumem, če so predstavljeni z grafičnim modelom ali diagramom.",
        "q6": "Zame so najbolj učinkoviti zapiski v obliki alinej in strukturiranega besedila.",
        "submit": "Določi mojo preferenco",
        "tie_title": "Oba načina predstavitve vam enako ustrezata.",
        "tie_description": "Vaši odgovori kažejo enako preferenco za oba načina predstavitve. Izberite tistega, ki vam je na splošno ljubši.",
        "tie_visual": "Vizualna predstavitev",
        "tie_verbal": "Besedilna predstavitev",
        "saving": "Shranjevanje izbire ..."
      },

      // LEKCIJA, KVIZ IN VIZUALIZACIJA
      "loading_quiz": "Sestavljam vprašanja...",
      "quiz_unavailable": "Kviz za to lekcijo trenutno ni na voljo.",
      "quiz_question": "Vprašanje",
      "check_answer": "Preveri odgovor",
      "next_question": "Naslednje vprašanje",
      "finish_quiz": "Zaključi kviz",
      "loading_visual": "Pripravljam vizualizacijo...",
      "visual_error_title": "Napaka pri vizualizaciji",
      "visual_error_desc": "Diagrama ni bilo mogoče izrisati. Poskusite osvežiti.",
      "lessons_progress": "Zaključil/a si {{count}} od {{total}} lekcij. Nadaljuj z učenjem.",
      "survey_unlocked": "Zaključil/-a si 3 lekcije. Končni vprašalnik je zdaj na voljo.",
      "open_survey": "Odpri vprašalnik",
      "back_generic": "Nazaj",
      "next_generic": "Naprej",

      // PREDLOGI ZA PONOVITEV
      "adaptive_review_title": "Predlog za ponovitev",
      "adaptive_review_text_visual": "Na podlagi rezultata kviza priporočamo ponoven ogled vizualnega prikaza.",
      "adaptive_review_text_verbal": "Na podlagi rezultata kviza priporočamo ponoven ogled povzetka.",
      "open_summary": "Odpri povzetek",
      "open_visualization": "Odpri vizualizacijo",
      "skip_review_suggestion": "Preskoči predlog",

      // PRILAGODLJIV UPORABNIŠKI VMESNIK
      "adaptive_visual_hidden": "Vizualni povzetek je skrit, da se lažje osredotočite na besedilo.",
      "show_visual_summary": "Prikaži vizualni povzetek",
      "show_anyway": "Vseeno pokaži",
      "adaptive_highlight_explanation": "Označili smo ključne informacije, ki vam lahko pomagajo pri hitrem pregledu učne vsebine.",

      // KONČNI VPRAŠALNIK
      "survey": {
        "title": "Končni vprašalnik",
        "subtitle": "Vaše povratne informacije so ključnega pomena za raziskovalni del te magistrske naloge.",
        "sus_trust_privacy_acceptance": "OCENA PLATFORME SMARTSTUDY",

        "scale_left": "Sploh se ne strinjam",
        "scale_right": "Popolnoma se strinjam",

        "submit": "ODDAJ ODGOVORE",
        "sending": "Pošiljanje...",

        "error_incomplete": "Prosimo, odgovorite na vsa vprašanja pred oddajo vprašalnika.",
        "error_submit": "Pri oddaji je prišlo do napake. Prosimo, poskusite znova.",
        "error_not_logged_in": "Za oddajo vprašalnika morate biti prijavljeni.",
                
        // Lestvica uporabnosti sistema
        "sus1": "Menim, da bi ta sistem uporabljal/-a pogosto.",
        "sus2": "Sistem se mi je zdel po nepotrebnem zapleten.",
        "sus3": "Menil/-a sem, da je sistem enostaven za uporabo.",
        "sus4": "Menim, da bi za uporabo tega sistema potreboval/-a pomoč tehnične osebe.",
        "sus5": "Različne funkcije sistema so se mi zdele dobro povezane med seboj.",
        "sus6": "Menil/-a sem, da je v sistemu preveč nedoslednosti.",
        "sus7": "Predvidevam, da bi se večina ljudi zelo hitro naučila uporabljati ta sistem.",
        "sus8": "Sistem se mi je zdel zelo neroden za uporabo.",
        "sus9": "Pri uporabi sistema sem se počutil/-a zelo samozavestno.",
        "sus10": "Preden sem lahko začel/-a uporabljati sistem, sem se moral/-a naučiti veliko stvari.",

        // Zaupanje
        "trust1": "Prepričan/a sem v platformo SmartStudy",
        "trust2": "Platforma SmartStudy je zanesljiva.",
        "trust3": "Platformi SmartStudy lahko zaupam.",

        // Zaznana transparentnost zbiranja in uporabe podatkov
        "privacy1": "Jasno mi je bilo, katere podatke platforma SmartStudy zbira med mojo uporabo.",
        "privacy2": "Jasno mi je bilo, za kakšen namen platforma SmartStudy zbira podatke med uporabo.",
        "privacy3": "Jasno mi je bilo, kako platforma SmartStudy uporablja podatke, zbrane med uporabo.",

        // Sprejetost
        "acceptance1": "Platformo SmartStudy nameravam uporabljati tudi v prihodnje.",
        "acceptance2": "Pričakujem, da bom platformo SmartStudy uporabljal/-a tudi v prihodnje.",
        "acceptance3": "Načrtujem uporabo platforme SmartStudy tudi pri prihodnjem učenju.",

        // Zaznana personalizacija
        "perceivedPersonalization1": "Platforma SmartStudy je upoštevala moje potrebe pri predstavitvi učne vsebine.",
        "perceivedPersonalization2": "Platforma SmartStudy je upoštevala moje preference glede načina predstavitve učne vsebine.",
        "perceivedPersonalization3": "Imela/-a sem občutek, da je bila predstavitev učne vsebine na platformi SmartStudy prilagojena meni.",

        // Zaznava prilagajanja
        "adaptation_notice": "Opazil/-a sem, da je platforma med učenjem prilagajala svoje delovanje glede na moje interakcije."
      },

      // ZAKLJUČEK RAZISKAVE
      "thank_you_title": "Hvala za sodelovanje!",
      "thank_you_desc": "Vaši odgovori so bili uspešno shranjeni. S klikom na »Zaključi raziskavo« boste zaključili sodelovanje in se odjavili.",
      "research_completed": {
        "title": "Raziskava zaključena",
        "description": "Hvala za sodelovanje v raziskavi SmartStudy."
      },

      // UČNI VODNIK
      "coach_title": "Učni vodnik",
      "coach_subtitle": "Prilagojeno vodenje skozi lekcijo",
      "coach_why_title": "Zakaj takšna postavitev?",
      "coach_why_visual": "Prikaz je trenutno prilagojen vizualni predstavitvi. Sistem daje prednost diagramom in strukturiranemu prikazu.",
      "coach_why_verbal": "Prikaz je trenutno prilagojen besedilni predstavitvi. Sistem daje prednost jasnemu besedilu in osredotočenemu branju.",
      "coach_next_title": "Predlagan naslednji korak",
      "coach_next_visual": "Začni z miselnim vzorcem, da dobiš strukturo, nato preberi besedilo za podrobnosti.",
      "coach_next_verbal": "Najprej mirno preberi snov. Ključne izraze uporabi kot oporne točke, nato reši kviz.",
      "coach_next_reveal_visual": "Želiš hiter pregled? Vizualni povzetek lahko kadarkoli prikažeš.",
      "opened": "Odprto",

      "takeaways_title": "Povzetek",

      "next_step_visual": "Prebral/-a si glavno vsebino. Nadaljuj s povzetkom ali kvizom.",
      "next_step_verbal": "Prebral/-a si glavno vsebino. Nadaljuj z vizualizacijo ali kvizom.",
      "visual_summary_available": "Na voljo je še vizualni povzetek.",

      "summary_available": "Besedilni povzetek je na voljo.",
      "show_summary": "Prikaži povzetek",

      "reading_completed_toast": "Dosegel/-la si konec vsebine. Na voljo so dodatne aktivnosti.",

      // RAZLAGE NAČINA PRIKAZA
      "display_mode_change_visual": "Trenutni prikaz daje večji poudarek vizualnemu pregledu in hitrejšemu razumevanju učne vsebine.",
      "display_mode_change_verbal": "Trenutni prikaz daje večji poudarek podrobnejšim razlagam in osredotočenemu branju učne vsebine.",

      // RAZLAGE UČNEGA CILJA
      "learning_goal_short_quick_understanding": "Ker vam je pomemben hiter pregled bistva, so ključne informacije predstavljene bolj strnjeno.",
      "learning_goal_short_deep_understanding": "Ker vam je pomembno poglobljeno razumevanje, je poudarek na podrobnejši razlagi in dodatnih primerih.",
      "learning_goal_short_exam_preparation": "Ker vam je pomembno utrjevanje ključnih informacij, je večji poudarek na najpomembnejših pojmih in preverjanju razumevanja.",
      "learning_goal_short_revision": "Ker vam je pomembna osvežitev že znanih informacij, je poudarek na hitrem pregledu najpomembnejših vsebin.",

      // PREKLOP NAČINA PREDSTAVITVE
      "style_switch_title": "Predlog prilagoditve",
      "style_switch_question_visual": "Želite preklopiti na vizualni način predstavitve?",
      "style_switch_question_verbal": "Želite preklopiti na besedilni način predstavitve?",
      "style_switch_text_visual": "Opazili smo, da pogosto odpirate vizualne prikaze. Sistem vam zato predlaga vizualni način predstavitve vsebine.",
      "style_switch_text_verbal": "Opazili smo, da pogosto odpirate povzetke. Sistem vam zato predlaga besedilni način predstavitve vsebine.",
      "switch_to_visual": "Preklopi na vizualni način",
      "switch_to_verbal": "Preklopi na besedilni način",
      "keep_current_style": "Ostani pri trenutnem načinu",

      // PREKLIC SODELOVANJA
      "withdrawal": {
        "open": "Prekliči sodelovanje",
        "title": "Preklic sodelovanja",
        "description": "S preklicem sodelovanja bodo izbrisani vaš uporabniški profil in vsi raziskovalni podatki, povezani z vašim identifikatorjem.",
        "warning": "Tega dejanja ni mogoče razveljaviti. Po izbrisu se s trenutnim identifikatorjem in dostopno kodo ne boste mogli več prijaviti.",
        "cancel": "Nazaj",
        "confirm": "Izbriši moje podatke",
        "deleting": "Brisanje ...",
        "delete_error": "Pri brisanju podatkov je prišlo do napake. Prosimo, poskusite znova."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "sl",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;