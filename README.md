<h1>Join – Web-Based Project Management Application</h1>

<p><strong>Join</strong> is a web-based multi-page application (MPA) for task and project management, inspired by tools like <em>Trello</em> and <em>Jira</em>. It allows users to create, organize, and manage tasks within a structured board system. The application is built entirely with <strong>HTML</strong>, <strong>CSS</strong>, and <strong>JavaScript</strong>, and uses the <strong>Firebase Realtime Database</strong> as its backend service.</p>

<hr>

<h2>✨ Features</h2>
<ul>
  <li>User login and registration (default entry point: <code>index.html</code>)</li>
  <li>Task management with status columns (To Do, In Progress, Awaiting Feedback, Done)</li>
  <li>Drag-and-drop functionality for tasks</li>
  <li>Contact management</li>
  <li>Responsive UI for desktop and mobile</li>
  <li>Firebase integration for persistent data storage</li>
  <li>Multi-page architecture without frameworks</li>
</ul>

<hr>

<h2>📁 Project Structure</h2>

<pre>
/join
│
├── assets/               # Images, icons, logos
├── css/                  # Stylesheets
├── js/                   # JavaScript modules
├── assets/templates/     # HTML templates for MPA
│
├── index.html            # Login page (entry point)
├── register.html         # Registration page
├── summary.html          # Dashboard
├── board.html            # Task board
├── contacts.html         # Contact management
├── legal_notice.html     # Legal Notice
├── privacy_policy.html   # Privacy Police
│
├── script.js             # Global js file
│
├── style.css             # Global cs file
│
├── LICENSE               # License
└── README.md
</pre>

<hr>

<h2>🛠️ Technologies Used</h2>
<ul>
  <li><strong>HTML5</strong> — Application structure</li>
  <li><strong>CSS3</strong> — Layout, responsive design, UI components</li>
  <li><strong>JavaScript (ES6)</strong> — Logic, rendering, routing, Firebase communication</li>
  <li><strong>Firebase Realtime Database</strong> — Cloud-based data storage</li>
  <li><strong>Firebase Authentication</strong> (optional)</li>
</ul>

<hr>

<h2>🔥 Firebase Configuration</h2>

<h3>1. Create a Firebase Project</h3>
<ol>
  <li>Go to <a href="https://console.firebase.google.com" target="_blank">https://console.firebase.google.com</a></li>
  <li>Create a new project</li>
  <li>Enable the Realtime Database</li>
  <li>(Optional) Enable Authentication</li>
  <li>Add a Web App and copy the Firebase configuration</li>
</ol>

<h3>2. Integrate Firebase into Join</h3>

<p>Create a file <code>firebase.js</code> inside the <code>/js/</code> directory:</p>

<pre>
<code>
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
</code>
</pre>

<hr>

<h2>💻 Installation & Local Setup</h2>

<h3>Requirements</h3>
<ul>
  <li>A modern browser (Chrome, Firefox, Edge)</li>
  <li>Optional: a local web server (e.g., VS Code Live Server)</li>
</ul>

<h3>Steps</h3>
<ol>
  <li>Clone the repository:
    <pre><code>git clone https://github.com/YOUR_USERNAME/join.git</code></pre>
  </li>

  <li>Navigate into the project folder:
    <pre><code>cd join</code></pre>
  </li>

  <li>Start a local server (recommended):
    <p>Using VS Code: <strong>Right-click → "Open with Live Server"</strong></p>
    <p>Or using Python:</p>
    <pre><code>python3 -m http.server</code></pre>
  </li>

  <li>Open in your browser:
    <pre><code>http://localhost:5500</code></pre>
  </li>
</ol>

<p><strong>Note:</strong> Firebase requires <code>http://</code> or <code>https://</code>.  
Running the app via <code>file://</code> will not work.</p>

<hr>

<h2>📌 Usage</h2>
<ul>
  <li>The application starts at <code>index.html</code> (login page).</li>
  <li>After logging in, you are redirected to the dashboard (<code>summary.html</code>).</li>
  <li>The sidebar allows navigation to the board, contacts, add task and settings.</li>
  <li>Tasks can be created, edited, deleted, and moved via drag-and-drop.</li>
</ul>

<hr>

<h2>🤝 Contributing</h2>
<p>Pull requests, bug reports, and feature suggestions are welcome.  
Please open an issue before submitting major changes.</p>

<hr>

<h2>📄 License</h2>
<p>This project is licensed under the <strong>MIT License</strong>.  
See the <code>LICENSE</code> file for details.</p>