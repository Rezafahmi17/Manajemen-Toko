export class AppError extends Error { constructor(message,status=400){super(message);this.status=status;} }
export const asyncHandler=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
export const slugify=s=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const code=(prefix='ORD')=>`${prefix}-${Date.now()}-${Math.floor(Math.random()*900+100)}`;
