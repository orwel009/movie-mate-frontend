import React from 'react';
const Pagination = ({ page, pageSize, count, onPageChange }) => {
  const total = Math.ceil(count/pageSize); if (total<=1) return null;
  const pages=[]; const start=Math.max(1,page-2); const end=Math.min(total,page+2);
  for(let i=start;i<=end;i++) pages.push(i);
  return (
    <div style={{marginTop:12,display:'flex',gap:6,alignItems:'center'}}>
      <button onClick={()=>onPageChange(Math.max(1,page-1))} disabled={page===1}>Prev</button>
      {start>1 && <button onClick={()=>onPageChange(1)}>1</button>}
      {start>2 && <span>…</span>}
      {pages.map(p=> <button key={p} onClick={()=>onPageChange(p)} style={{fontWeight:p===page?'bold':'normal'}}>{p}</button>)}
      {end<total-1 && <span>…</span>}
      {end<total && <button onClick={()=>onPageChange(total)}>{total}</button>}
      <button onClick={()=>onPageChange(Math.min(total,page+1))} disabled={page===total}>Next</button>
    </div>
  );
};
export default Pagination;