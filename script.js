/*************************
 * THEME & NAV HIGHLIGHT *
 *************************/
(function initThemeAndNav(){
  const root = document.documentElement;
  const saved = localStorage.getItem("theme") || "dark";
  if(saved === "light"){ root.classList.add("light"); } else { root.classList.remove("light"); }

  const toggle = document.getElementById("themeToggle");
  if(toggle){
    toggle.addEventListener("click", ()=>{
      root.classList.toggle("light");
      localStorage.setItem("theme", root.classList.contains("light") ? "light" : "dark");
    });
  }

  // Mark active nav link based on current page
  const page = document.documentElement.getAttribute("data-page");
  document.querySelectorAll(".nav-link").forEach(a=>{
    const href = (a.getAttribute("href")||"").split("?")[0];
    if(href.includes(page) || (page==="home" && href.includes("index.html"))){
      a.classList.add("active");
    }
  });
})();

/**********************
 * TOAST NOTIFICATIONS*
 **********************/
function showToast(message, type="success"){
  const root = document.getElementById("toastRoot");
  if(!root) return;
  const el = document.createElement("div");
  el.className = `toast ${type==="error"?"error":"success"}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(()=>{ el.style.opacity = "0"; el.style.transform = "translateY(6px)"; }, 2200);
  setTimeout(()=> root.removeChild(el), 2700);
}

/*************************
 * SIMPLE XML DATA MODEL *
 *************************
  We keep an XML string in localStorage -> "bankData"
  Structure:
  <bank>
    <users>
      <user>
        <id>...</id><name>...</name><email>...</email><password>...</password><balance>...</balance>
      </user>
    </users>
    <transactions>
      <transaction><from>...</from><to>...</to><amount>...</amount><date>YYYY-MM-DD</date></transaction>
    </transactions>
  </bank>
*/

function loadXML(){
  let xmlString = localStorage.getItem("bankData");
  if(!xmlString){
    // Seed a demo user to make testing easier (you can remove this)
    xmlString = `
      <bank>
        <users>
          <user>
            <id>1000</id>
            <name>Kitteneshwar ji</name>
            <email>kitteneshwar@example.com</email>
            <password>1234</password>
            <balance>50000</balance>
          </user>
        </users>
        <transactions></transactions>
      </bank>
    `;
    localStorage.setItem("bankData", xmlString);
  }
  return new DOMParser().parseFromString(xmlString, "application/xml");
}

function saveXML(xmlDoc){
  const serializer = new XMLSerializer();
  const xmlString = serializer.serializeToString(xmlDoc);
  localStorage.setItem("bankData", xmlString);
}

/*****************
 * AUTH / SESSION*
 *****************/
function requireAuthOrRedirect(){
  const currentUser = JSON.parse(localStorage.getItem("currentUser")||"null");
  if(!currentUser){
    window.location.href = "login.html";
    return null;
  }
  return currentUser;
}

function wireLogout(){
  const logoutBtn = document.getElementById("logoutBtn");
  if(logoutBtn){
    logoutBtn.addEventListener("click",(e)=>{
      e.preventDefault();
      localStorage.removeItem("currentUser");
      showToast("Logged out.");
      setTimeout(()=> window.location.href = "login.html", 600);
    });
  }
}

/*****************
 * VALIDATION     *
 *****************/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/***************
 * REGISTER     *
 ***************/
document.addEventListener("DOMContentLoaded", ()=>{
  const form = document.getElementById("registerForm");
  if(!form) return;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const balance = parseFloat(document.getElementById("balance").value);
    const msg = document.getElementById("msg");

    // validations
    if(name.length < 3) return (msg.textContent="Name must be at least 3 characters.", msg.style.color="var(--danger)", showToast("Invalid name","error"));
    if(!emailRegex.test(email)) return (msg.textContent="Enter a valid email.", msg.style.color="var(--danger)", showToast("Invalid email","error"));
    if(password.length < 4) return (msg.textContent="Password must be at least 4 characters.", msg.style.color="var(--danger)", showToast("Weak password","error"));
    if(!(balance >= 100)) return (msg.textContent="Minimum balance is ₹100.", msg.style.color="var(--danger)", showToast("Balance too low","error"));

    const xmlDoc = loadXML();
    const usersNode = xmlDoc.querySelector("users");

    // check duplicate email
    const dup = Array.from(usersNode.getElementsByTagName("user")).find(u => 
      u.getElementsByTagName("email")[0].textContent.toLowerCase() === email
    );
    if(dup){ msg.textContent="Email already registered."; msg.style.color="var(--danger)"; showToast("Email already registered","error"); return; }

    // create user
    const userNode = xmlDoc.createElement("user");
    const idNode = xmlDoc.createElement("id"); idNode.textContent = Date.now();
    const nameNode = xmlDoc.createElement("name"); nameNode.textContent = name;
    const emailNode = xmlDoc.createElement("email"); emailNode.textContent = email;
    const passNode = xmlDoc.createElement("password"); passNode.textContent = password;
    const balNode = xmlDoc.createElement("balance"); balNode.textContent = balance.toString();

    [idNode,nameNode,emailNode,passNode,balNode].forEach(n=> userNode.appendChild(n));
    usersNode.appendChild(userNode);
    saveXML(xmlDoc);

    msg.textContent = "Registration successful! Redirecting to login…";
    msg.style.color = "var(--success)";
    showToast("Account created 🎉","success");
    setTimeout(()=> window.location.href = "login.html", 900);
  });
});

/***********
 * LOGIN    *
 ***********/
document.addEventListener("DOMContentLoaded", ()=>{
  const loginForm = document.getElementById("loginForm");
  if(!loginForm) return;

  loginForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();
    const msg = document.getElementById("loginMsg");

    const xmlDoc = loadXML();
    const users = Array.from(xmlDoc.querySelectorAll("users > user"));

    const user = users.find(u=>{
      const e = u.getElementsByTagName("email")[0].textContent.toLowerCase();
      const p = u.getElementsByTagName("password")[0].textContent;
      return e===email && p===password;
    });

    if(!user){
      msg.textContent = "Invalid email or password.";
      msg.style.color = "var(--danger)";
      showToast("Login failed","error");
      return;
    }

    const session = {
      id: user.getElementsByTagName("id")[0].textContent,
      name: user.getElementsByTagName("name")[0].textContent,
      email: user.getElementsByTagName("email")[0].textContent,
      balance: parseFloat(user.getElementsByTagName("balance")[0].textContent)
    };
    localStorage.setItem("currentUser", JSON.stringify(session));
    msg.textContent = "Login successful! Redirecting…";
    msg.style.color = "var(--success)";
    showToast("Welcome back 👋","success");
    setTimeout(()=> window.location.href = "dashboard.html", 700);
  });
});

/****************
 * DASHBOARD     *
 ****************/
document.addEventListener("DOMContentLoaded", ()=>{
  wireLogout();
  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");
  const balEl = document.getElementById("userBalance");
  const recentTable = document.getElementById("recentTxTable");

  if(!(nameEl && emailEl && balEl)) return; // not on dashboard
  const currentUser = requireAuthOrRedirect();
  if(!currentUser) return;

  // populate user data
  nameEl.textContent = currentUser.name;
  emailEl.textContent = currentUser.email;
  balEl.textContent = Number(currentUser.balance).toLocaleString("en-IN");

  // recent transactions (last 5 involving the user)
  const xmlDoc = loadXML();
  const allTx = Array.from(xmlDoc.querySelectorAll("transactions > transaction"));
  const related = allTx.filter(tx=>{
    const from = tx.getElementsByTagName("from")[0].textContent;
    const to = tx.getElementsByTagName("to")[0].textContent;
    return from===currentUser.email || to===currentUser.email;
  }).slice(-5).reverse();

  if(recentTable){
    const tbody = recentTable.querySelector("tbody");
    tbody.innerHTML = "";
    related.forEach(tx=>{
      const from = tx.getElementsByTagName("from")[0].textContent;
      const to = tx.getElementsByTagName("to")[0].textContent;
      const amount = tx.getElementsByTagName("amount")[0].textContent;
      const date = tx.getElementsByTagName("date")[0].textContent;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${from}</td><td>${to}</td><td>₹${amount}</td><td>${date}</td>`;
      tbody.appendChild(tr);
    });
  }
});

/****************
 * TRANSFER      *
 ****************/
document.addEventListener("DOMContentLoaded", ()=>{
  wireLogout();
  const form = document.getElementById("transferForm");
  if(!form) return;

  const currentUser = requireAuthOrRedirect();
  if(!currentUser) return;

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const receiverEmail = document.getElementById("receiverEmail").value.trim().toLowerCase();
    const amt = parseFloat(document.getElementById("transferAmount").value);
    const msg = document.getElementById("transferMsg");

    if(!emailRegex.test(receiverEmail)){ msg.textContent="Enter a valid recipient email."; msg.style.color="var(--danger)"; showToast("Invalid recipient email","error"); return; }
    if(!(amt>0)){ msg.textContent="Amount must be greater than ₹0."; msg.style.color="var(--danger)"; showToast("Invalid amount","error"); return; }
    if(receiverEmail === currentUser.email){ msg.textContent="You cannot transfer to yourself."; msg.style.color="var(--danger)"; showToast("Cannot transfer to self","error"); return; }

    const xmlDoc = loadXML();
    const usersNode = xmlDoc.querySelector("users");
    const txNode = xmlDoc.querySelector("transactions");

    const users = Array.from(usersNode.getElementsByTagName("user"));
    const sender = users.find(u=> u.getElementsByTagName("email")[0].textContent.toLowerCase() === currentUser.email.toLowerCase());
    const receiver = users.find(u=> u.getElementsByTagName("email")[0].textContent.toLowerCase() === receiverEmail);

    if(!receiver){ msg.textContent="Recipient not found."; msg.style.color="var(--danger)"; showToast("Recipient not found","error"); return; }

    const senderBalEl = sender.getElementsByTagName("balance")[0];
    const receiverBalEl = receiver.getElementsByTagName("balance")[0];
    let senderBal = parseFloat(senderBalEl.textContent);
    let receiverBal = parseFloat(receiverBalEl.textContent);

    if(amt > senderBal){ msg.textContent="Insufficient balance."; msg.style.color="var(--danger)"; showToast("Insufficient balance","error"); return; }

    // Update balances
    senderBal -= amt; receiverBal += amt;
    senderBalEl.textContent = senderBal.toString();
    receiverBalEl.textContent = receiverBal.toString();

    // Record transaction
    const t = xmlDoc.createElement("transaction");
    const f = xmlDoc.createElement("from"); f.textContent = currentUser.email;
    const to = xmlDoc.createElement("to"); to.textContent = receiverEmail;
    const a = xmlDoc.createElement("amount"); a.textContent = String(amt);
    const d = xmlDoc.createElement("date"); d.textContent = new Date().toISOString().split("T")[0];
    [f,to,a,d].forEach(n=> t.appendChild(n));
    txNode.appendChild(t);

    // Save XML
    saveXML(xmlDoc);

    // Update session
    currentUser.balance = senderBal;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    msg.textContent = `₹${amt} sent to ${receiverEmail}.`;
    msg.style.color = "var(--success)";
    showToast(`Sent ₹${amt.toLocaleString("en-IN")} ✓`,"success");
    setTimeout(()=> window.location.href = "dashboard.html", 700);
  });
});

/****************
 * SUMMARY       *
 ****************/
document.addEventListener("DOMContentLoaded", ()=>{
  wireLogout();
  const table = document.getElementById("transactionTable");
  if(!table) return;

  const currentUser = requireAuthOrRedirect();
  if(!currentUser) return;

  const xmlDoc = loadXML();
  const all = Array.from(xmlDoc.querySelectorAll("transactions > transaction"));
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  all.forEach(tx=>{
    const from = tx.getElementsByTagName("from")[0].textContent;
    const to = tx.getElementsByTagName("to")[0].textContent;
    const amount = tx.getElementsByTagName("amount")[0].textContent;
    const date = tx.getElementsByTagName("date")[0].textContent;
    if(from===currentUser.email || to===currentUser.email){
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${from}</td><td>${to}</td><td>₹${amount}</td><td>${date}</td>`;
      tbody.appendChild(tr);
    }
  });
});
