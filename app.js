// ====== GLOBAL STATE ======
let users = JSON.parse(localStorage.getItem("users")) || [];
let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

// ====== SAVE FUNCTION ======
function saveState() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("posts", JSON.stringify(posts));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

// ====== INIT ======
function init() {
  if (currentUser) {
    renderHome();
  } else {
    renderAuth();
  }
}

// ====== AUTH ======
function renderAuth() {
  document.getElementById("app").innerHTML = `
    <div class="container">
      <div class="auth-card">
        <h2>BONDED</h2>
        <input id="username" placeholder="Username">
        <textarea id="bio" placeholder="Bio"></textarea>
        <button onclick="register()">Create Account</button>
        <hr>
        <div id="userList"></div>
      </div>
    </div>
  `;

  const list = document.getElementById("userList");
  list.innerHTML = "";
  users.forEach(u => {
    list.innerHTML += `
      <div style="display:flex;justify-content:space-between;margin-top:8px">
        <span>@${u.username}</span>
        <button onclick="login(${u.id})">Login</button>
      </div>
    `;
  });
}

function register() {
  const username = document.getElementById("username").value.trim();
  const bio = document.getElementById("bio").value.trim();

  if (!username) return alert("Username required");

  if (users.some(u => u.username === username)) {
    return alert("Username already exists");
  }

  const user = {
    id: Date.now(),
    username,
    bio,
    followers: [],
    following: [],
    bonds: {}
  };

  users.push(user);
  currentUser = user;
  saveState();
  renderHome();
}

function login(id) {
  currentUser = users.find(u => u.id === id);
  saveState();
  renderHome();
}

function logout() {
  currentUser = null;
  saveState();
  renderAuth();
}

// ====== HOME ======
function renderHome() {
  if (!currentUser) return renderAuth();

  document.getElementById("app").innerHTML = `
    <div class="navbar">
      <h3>BONDED</h3>
      <div>
        <button onclick="viewProfile(${currentUser.id})">Profile</button>
        <button onclick="logout()">Logout</button>
      </div>
    </div>

    <div class="container">
      <div class="create-post">
        <textarea id="postInput" placeholder="Share something..."></textarea>
        <button onclick="createPost()">Post</button>
      </div>
      <div id="feed"></div>
    </div>
  `;

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  posts.forEach(p => {
    const user = users.find(u => u.id === p.userId);
    const isOwn = user.id === currentUser.id;

    feed.innerHTML += `
      <div class="post">
        <div class="post-header">
          <span onclick="viewProfile(${user.id})" style="cursor:pointer">
            @${user.username}
          </span>
          ${
            !isOwn
              ? `<button class="follow-btn" onclick="toggleFollow(${user.id})">
                   ${
                     currentUser.following.includes(user.id)
                       ? "Following"
                       : "Follow"
                   }
                 </button>`
              : ""
          }
        </div>
        <div>${p.content}</div>

        <div id="bondMessage-${p.id}" class="bond-notification"></div>

        <div class="comment-section">
          <h4>Comments</h4>
          ${(p.comments || []).map(c => {
            const commenter = users.find(u => u.id === c.userId);
            return `<div class="comment"><strong>@${commenter.username}</strong>: ${c.content}</div>`;
          }).join("")}
          <textarea id="commentInput-${p.id}" placeholder="Write a comment..."></textarea>
          <button onclick="addComment(${p.id})">Add Comment</button>
        </div>
      </div>
    `;
  });
}

// ====== CREATE POST ======
function createPost() {
  const content = document.getElementById("postInput").value.trim();
  if (!content) return;

  posts.unshift({
    id: Date.now(),
    userId: currentUser.id,
    content,
    comments: []
  });

  saveState();
  renderHome();
}

// ====== COMMENTS ======
function addComment(postId) {
  const input = document.getElementById(`commentInput-${postId}`);
  const content = input.value.trim();
  if (!content) return;

  const post = posts.find(p => p.id === postId);
  post.comments.push({ userId: currentUser.id, content });

  updateBond(currentUser.id, post.userId);
  saveState();

  const commentSection = input.parentElement;
  const commenter = users.find(u => u.id === currentUser.id);
  const newComment = document.createElement("div");
  newComment.className = "comment";
  newComment.innerHTML = `<strong>@${commenter.username}</strong>: ${content}`;
  commentSection.insertBefore(newComment, input);

  input.value = "";
}

// ====== BOND SYSTEM ======
function updateBond(userA, userB) {
  const a = users.find(u => u.id === userA);
  const b = users.find(u => u.id === userB);

  if (!a.bonds[userB]) a.bonds[userB] = { count: 0, stage: "none" };
  if (!b.bonds[userA]) b.bonds[userA] = { count: 0, stage: "none" };

  a.bonds[userB].count++;
  b.bonds[userA].count++;

  const count = a.bonds[userB].count;
    if (count === 3 && stage === "none") {
    stage = "Van der Waals";
    notifyBond(userA, userB, "A WEAK Van der Waals bond found!");
  } else if (count === 5 && stage === "Van der Waals") {
    stage = "Hydrogen";
    notifyBond(userA, userB, "A MILD Hydrogen bond found!");
  } else if (count === 10 && stage === "Hydrogen") {
    stage = "Ionic";
    notifyBond(userA, userB, "A STRONG Ionic bond found! Profiles unlocked!");
  } else if (count >= 20 && stage === "Ionic") {
    stage = "LoveQuestion";
    notifyBond(userA, userB, "💜 Your bond is strong! Answer the Love Question...");
    showLoveQuestion(userA, userB);
  }

  a.bonds[userB].stage = stage;
  b.bonds[userA].stage = stage;
}

function notifyBond(userA, userB, message) {
  posts.filter(p => p.userId === userB).forEach(p => {
    const bondBox = document.getElementById(`bondMessage-${p.id}`);
    if (bondBox) {
      bondBox.innerHTML = message;
      setTimeout(() => bondBox.innerHTML = "", 4000);
    }
  });
}

// ====== LOVE QUESTION ======
function showLoveQuestion(userA, userB) {
  const app = document.getElementById("app");
  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
    <div class="popup-card">
      <h3>💜 What is Love for You?</h3>
      <textarea id="loveAnswer" placeholder="Write your answer..."></textarea>
      <button onclick="submitLoveAnswer(${userA}, ${userB})">Submit</button>
    </div>
  `;
  app.appendChild(popup);
}

function submitLoveAnswer(userA, userB) {
  const answer = document.getElementById("loveAnswer").value.trim();
  if (!answer) return alert("Please write your answer!");

  const a = users.find(u => u.id === userA);
  const b = users.find(u => u.id === userB);

  if (!a.loveAnswers) a.loveAnswers = {};
  if (!b.loveAnswers) b.loveAnswers = {};

  a.loveAnswers[userB] = answer;
  b.loveAnswers[userA] = answer;

  saveState();

  if (a.loveAnswers[userB] && b.loveAnswers[userA]) {
    if (a.loveAnswers[userB].toLowerCase() === b.loveAnswers[userA].toLowerCase()) {
      notifyBond(userA, userB, "💜 It's a Match — You Think Love the Same Way!");
    } else {
      notifyBond(userA, userB, "You both answered differently, but your bond remains strong!");
    }
  }

  document.querySelector(".popup").remove();
}

// ====== PROFILE ======
function viewProfile(id) {
  const user = users.find(u => u.id === id);
  const isOwn = user.id === currentUser.id;

  const bondStage = currentUser.bonds[id]?.stage || "none";
  const canView = bondStage === "Ionic" || bondStage === "LoveQuestion" || isOwn;

  document.getElementById("app").innerHTML = `
    <div class="navbar">
      <button onclick="renderHome()">Home</button>
      <button onclick="logout()">Logout</button>
    </div>

    <div class="profile-card">
      <h3>@${user.username}</h3>
      ${canView ? `<p>${user.bio}</p>` : `<p>Profile locked until Ionic bond!</p>`}
      <div class="stats">
        <span>${user.followers.length} Followers</span>
        <span>${user.following.length} Following</span>
      </div>
      ${
        !isOwn
          ? `<button class="follow-btn" onclick="toggleFollow(${user.id})">
              ${
                currentUser.following.includes(user.id)
                  ? "Following"
                  : "Follow"
              }
              </button>`
          : ""
      }
    </div>
  `;
}

// ====== FOLLOW ======
function toggleFollow(userId) {
  const target = users.find(u => u.id === userId);

  if (currentUser.following.includes(userId)) {
    currentUser.following =
      currentUser.following.filter(id => id !== userId);
    target.followers =
      target.followers.filter(id => id !== currentUser.id);
  } else {
    currentUser.following.push(userId);
    target.followers.push(currentUser.id);
  }

  saveState();
  renderHome();
}

// ====== RESET DATA ======
// ====== RESET COMMENTS ======
function clearAllComments() {
  posts.forEach(post => {
    post.comments = []; // remove all comments from each post
  });
  saveState();
  renderHome();
}

// ====== START APP ======
init();