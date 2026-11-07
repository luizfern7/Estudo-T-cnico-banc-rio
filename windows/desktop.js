(()=>{'use strict';
const click=action=>{const element=document.querySelector(`[data-action="${action}"]`);if(element&&!element.disabled)element.click();return element};
window.JornadaDesktop?.onShortcut(action=>{if(action==='open-json'){click('import');click('pick-file')}if(action==='backup'){click('settings');click('backup')}});
function editable(target){return target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target?.tagName)}
function currentQuestion(){const focused=document.activeElement?.closest('article.integrated-q');if(focused)return focused;const all=[...document.querySelectorAll('article.integrated-q')];return all.find(article=>{const r=article.getBoundingClientRect();return r.bottom>100&&r.top<innerHeight-80&&article.querySelector('[data-action="answer"]')})||all.find(a=>a.querySelector('[data-action="answer"]'))}
document.addEventListener('keydown',event=>{if(event.defaultPrevented||editable(event.target)||event.altKey||event.ctrlKey||event.metaKey)return;
 if(event.key==='Escape'){const b=document.querySelector('.back-link:not([hidden])');if(b){event.preventDefault();b.click()}return}
 if(/^[1-5]$/.test(event.key)){const q=currentQuestion(),button=q?.querySelector(`[data-action="choose"][data-choice="${Number(event.key)-1}"]`);if(button&&!button.disabled){event.preventDefault();const id=q.dataset.qid;button.click();document.querySelector(`article[data-qid="${id}"] [data-action="choose"][data-choice="${Number(event.key)-1}"]`)?.focus({preventScroll:true})}return}
 if(event.key==='Enter'&&document.querySelector('#reading')){const question=currentQuestion(),confirm=question?.querySelector('[data-action="answer"]');if(confirm&&!confirm.disabled){event.preventDefault();confirm.click();return}const complete=document.querySelector('[data-action="complete"]');if(complete&&!complete.disabled){event.preventDefault();complete.click()}}
});
})();
