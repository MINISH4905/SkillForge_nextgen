function evaluateCode(domainName, csrfToken) {
    const btn = document.getElementById('runBtn');
    const text = document.getElementById('runBtnText');
    const loader = document.getElementById('runBtnLoader');
    const consoleEl = document.getElementById('console');
    const consoleBody = document.getElementById('consoleBody');
    const code = document.getElementById('codeEditor').value;

    if (!btn || !consoleEl || !consoleBody) return;

    // UI state: Loading
    btn.disabled = true;
    if (text) text.innerText = "Evaluating...";
    if (loader) loader.style.display = "inline-block";
    consoleEl.style.display = "block";
    consoleBody.innerHTML = "Verifying logic against solution...";
    consoleBody.className = "";

    fetch('/api/evaluate/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            'domain': domainName,
            'submitted_code': code
        })
    })
    .then(r => r.json())
    .then(data => {
        if(data.status === 'success') {
            consoleBody.innerHTML = `<span class="success-text">✔ ${data.message}</span>`;
            setTimeout(() => {
                alert(data.message || "Level Up! XP Granted.");
                window.location.href = data.next_url;
            }, 1000);
        } else {
            consoleBody.innerHTML = `<span class="fail-text">✘ ${data.message}</span><br><br><span style="color: #666;">Hint: ${data.hint || 'Check for syntax or logical errors.'}</span>`;
        }
    })
    .catch(err => {
        consoleBody.innerHTML = `<span class="fail-text">Error: ${err.message}</span>`;
    })
    .finally(() => {
        if (btn) btn.disabled = false;
        if (text) text.innerText = "Run & Evaluate";
        if (loader) loader.style.display = "none";
    });
}

// HINTS SYSTEM
function loadHints(levelId) {
    fetch(`/api/hints/?level_id=${levelId}`)
    .then(r => r.json())
    .then(data => {
        const hintList = document.getElementById('hintList');
        const hintBtn = document.getElementById('hintBtn');
        const hintBtnCost = document.getElementById('hintBtnCost');
        
        if (!hintList) return;
        
        hintList.innerHTML = '';
        if (data.unlocked_hints.length === 0) {
            hintList.innerHTML = '<p style="color: #666; font-size: 0.85rem;">No hints unlocked yet.</p>';
        } else {
            data.unlocked_hints.forEach(h => {
                const div = document.createElement('div');
                div.style.padding = '10px';
                div.style.borderLeft = '3px solid var(--primary)';
                div.style.background = '#222';
                div.style.marginBottom = '10px';
                div.style.fontSize = '0.9rem';
                div.innerHTML = `<strong>Hint ${h.order}:</strong> ${h.content}`;
                hintList.appendChild(div);
            });
        }
        
        if (data.next_hint_cost !== null) {
            if (hintBtn) hintBtn.style.display = 'block';
            if (hintBtnCost) hintBtnCost.innerText = `(${data.next_hint_cost} XP)`;
        } else {
            if (hintBtn) hintBtn.style.display = 'none';
        }
    });
}

function unlockHint(levelId, csrfToken) {
    if (!confirm("Are you sure you want to unlock the next hint?")) return;
    
    fetch('/api/use-hint/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ 'level_id': levelId })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            loadHints(levelId);
        } else {
            alert(data.message);
        }
    });
}

// POWERS SYSTEM
function loadPowers() {
    fetch('/api/user-powers/')
    .then(r => r.json())
    .then(data => {
        const powerList = document.getElementById('powerList');
        if (!powerList) return;
        
        powerList.innerHTML = '';
        if (data.powers.length === 0) {
            powerList.innerHTML = '<p style="color: #666; font-size: 0.85rem;">No powers available.</p>';
        } else {
            data.powers.forEach(p => {
                const btn = document.createElement('button');
                btn.className = 'btn';
                btn.style.padding = '5px 12px';
                btn.style.fontSize = '0.75rem';
                btn.style.background = '#333';
                btn.style.border = '1px solid #444';
                btn.style.display = 'flex';
                btn.style.justifyContent = 'space-between';
                btn.style.alignItems = 'center';
                btn.style.gap = '8px';
                btn.style.marginBottom = '8px';
                btn.style.width = '100%';
                
                btn.innerHTML = `
                    <span title="${p.description}">${p.name}</span>
                    <span class="badge" style="padding: 2px 6px;">x${p.quantity}</span>
                `;
                btn.onclick = () => applyPower(p.id, p.name);
                powerList.appendChild(btn);
            });
        }
    });
}

function applyPower(powerId, powerName) {
    const domainName = document.body.dataset.domain;
    const csrfToken = document.body.dataset.csrf;
    
    if (!confirm(`Are you sure you want to use ${powerName}?`)) return;
    
    fetch('/api/apply-power/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ 
            'power_id': powerId,
            'domain': domainName
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.message);
            if (data.next_url) {
                window.location.href = data.next_url;
            } else {
                loadPowers();
            }
        } else if (data.status === 'info') {
            alert(data.message);
        } else {
            alert(data.message);
        }
    });
}

// Tab handling in textarea
function initTabHandling(editorId) {
    const editor = document.getElementById(editorId);
    if (!editor) return;

    editor.onkeydown = function(e) {
        if (e.key == 'Tab') {
            e.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;
            this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
        }
    };
}

// Initializing UI elements
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('codeEditor')) {
        initTabHandling('codeEditor');
        
        // For level page only
        const levelId = document.body.dataset.levelId;
        if (levelId) {
            loadHints(levelId);
            loadPowers();
        }
    }
});

