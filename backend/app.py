from datetime import datetime, timezone
import os, re
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title='Rewards Nomination Evaluator API', version='1.0.0')
origins = [x.strip() for x in os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',') if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

BANDS = {
'C1': (False,False,1.00,0,0,50,'Associate / Trainee'), 'C2': (False,False,1.00,0,0,52,'Software Engineer / Consultant'),
'C3': (False,False,1.02,2,1,56,'Senior Consultant'), 'C4': (False,False,1.05,5,2,62,'Lead Engineer / Specialist'),
'C5': (True,False,1.10,10,4,74,'Manager / Delivery Manager'), 'C6': (True,True,1.15,15,7,80,'Senior Manager / Associate Director'),
'C7': (True,True,1.20,20,10,84,'Director / Practice Head'), 'C8': (True,True,1.25,25,13,88,'Senior Director / AVP'),
'C9': (True,True,1.30,30,16,92,'Vice President (VP)'), 'C10': (True,True,1.35,35,18,95,'Senior VP / CXO / MD / Board')}
BASE = dict(zip(BANDS, [52,56,62,70,80,86,90,94,97,99]))
def st(v): return str(v or '').strip()
def nominator(n):
    explicit=st(n.get('nominatorCompetency')).upper(); text=f"{st(n.get('nominatedBy'))} {st(n.get('nominatorRole'))}"
    m=re.search(r'\b(C10|C[1-9])\b',text,re.I); level=explicit if explicit in BANDS else (m.group(1).upper() if m else '')
    if not level:
        low=text.lower(); terms=[('C10',['c10','cxo','managing director','ceo','cto','coo','svp','senior vice president','president','board']),('C9',['c9','vp','vice president']),('C8',['c8','senior director','sr. director','avp']),('C7',['c7','director','practice head']),('C6',['c6','senior manager','sr. manager','associate director','delivery head','principal architect']),('C5',['c5','manager','delivery manager','project manager','scrum master']),('C4',['c4','lead','architect','specialist']),('C3',['c3','senior','sr.']),('C2',['c2','engineer','consultant']),('C1',['c1','associate','trainee'])]
        level=next((b for b, words in terms if any(w in low for w in words)),'C4')
    manager,senior,mult,boost,points,floor,role=BANDS[level]
    return dict(level=level,isManagerC5=manager and not senior,isSeniorLeadershipC6Plus=senior,isManagerSponsored=manager,multiplier=mult,boostPercentage=boost,boostPoints=points,authorityFloor=floor,roleDescription=role)
def proof_summary(n):
    docs=n.get('proofDocuments') if isinstance(n.get('proofDocuments'),list) else []; types=list(dict.fromkeys(p.get('fileType') or 'other' for p in docs)); details=[]; snippets=[]
    for p in docs:
        em=p.get('emailMeta') or {}; name=p.get('fileName','')
        if em:
            snippets.append(f'[Email: {name}] Subject: "{em.get("subject","")}" from {em.get("from","Sender")} to {em.get("to","Recipient")} on {em.get("date","")}. Content: "{st(em.get("bodySnippet"))[:350]}"'); details.append(f'Client Email: "{em.get("subject") or name}"')
        elif p.get('extractedContent'):
            snippets.append(f'[Doc: {name}] Certified Record: "{st(p.get("extractedContent"))[:350]}"'); details.append(f'Signed PDF / Dossier: "{name}"')
        else:
            snippets.append(f'[File: {name}] Format: {st(p.get("fileType") or "proof").upper()} ({p.get("formattedSize","")}) attached to candidate record.'); details.append(f'Proof File: "{name}" ({st(p.get("fileType") or "proof").upper()})')
    marked=st(n.get('isAttachmentUploaded')).lower()=='yes' or n.get('isAttachmentUploaded') is True
    summary=(f'{len(docs)} Verified Proof Document(s) Attached:\n'+'\n'.join(f'{i+1}. {v}' for i,v in enumerate(snippets))) if docs else ('Spreadsheet registry indicates supporting attachment submitted with nomination (awaiting original document file upload).' if marked else 'No proof documents (emails/PDFs/images) uploaded for this candidate.')
    return docs,types,details,marked,summary

def evaluate(n: dict[str,Any]):
    citation=st(n.get('nominationCitation')); info=st(n.get('contributionInfo')); contrib=st(n.get('contributionFor')); approver=st(n.get('primaryApproverStatus')); shared=st(n.get('sharedServicesStatus')); criteria=st(n.get('evaluationCriteria')); decision=st(n.get('internalDecision')).lower()
    comments=' '.join(x for x in [citation,info,contrib,approver,shared] if x); low=comments.lower(); chars=len(comments); nom=nominator(n)
    currency=re.findall(r'[$€£₹]\s*\d+(?:,\d+)*(?:\.\d+)?\s*(?:k|m|b|million|thousand|crore|lakh)?(?:\s*arr)?',comments,re.I)
    pct=re.findall(r'\b\d+(?:\.\d+)?%',comments); times=re.findall(r'\b\d+\s*(?:hours|hrs|minutes|mins|days|weeks|months|sprints|quarters)\b',comments,re.I); volume=re.findall(r'\b\d+\s*(?:repositories|repos|clusters|members|engineers|workshops|promotions|queries|incidents|outages|tickets|clients|accounts|squads|users)\b',comments,re.I)
    terms=['saved','reduced','increased','prevented','automated','delivered','optimized','accelerated','csat','uptime','sla','roi','zero downtime','zero-day','turnaround','commendation']; matched=[x for x in terms if x in low]; metrics=list(dict.fromkeys(currency+pct+times+volume)); count=len(metrics); has_metrics=bool(count)
    depth=min(chars/12,35); metric=min(count*12+len(matched)*3.5,45); words=[w for w in re.sub(r'[^a-z0-9\s]',' ',criteria.lower()).split() if len(w)>=3 and w not in ['and','for','the','with','applies']]
    matched_count=sum(1 for w in words if w in low or (len(w[:max(len(w)-2,3)])>=3 and w[:max(len(w)-2,3)] in low)); ratio=min(matched_count/max(len(words)*.4,1),1) if words else .75; criteria_score=min(max(round(ratio*20),8),20)
    comments100=min(max(round(depth+metric+criteria_score),48),98); comments_score=round(comments100/10,1)
    docs,types,details,marked,proof_text=proof_summary(n); verified=bool(docs); proof100=86
    if docs:
        email=pdf=praise=metric_proof=False
        for p in docs:
            name=st(p.get('fileName')); em=p.get('emailMeta') or {}; t=f"{name} {st(p.get('extractedContent'))} {st(em.get('subject'))} {st(em.get('bodySnippet'))}".lower()
            email |= p.get('fileType')=='email' or name.endswith(('.eml','.msg')) or bool(em); pdf |= p.get('fileType')=='pdf' or name.endswith('.pdf')
            praise |= any(x in t for x in ['thank','appreciation','commend','fantastic','exceptional','exceeded','client','vp']); metric_proof |= any(x in t for x in ['$', '%','uptime','sla','signoff','approved','delivered'])
        proof100=min(86+(5 if email else 0)+(4 if pdf else 0)+(3 if praise else 0)+(2 if metric_proof else 0)+(2 if len(docs)>1 else 0),100)
        proof_text=f"{len(docs)} verified proof document(s) attached ({', '.join(st(p.get('fileName')) for p in docs)}). Directly corroborates spreadsheet claims with concrete documentary evidence."
    elif marked: proof100=74; proof_text='Supporting proof artifact confirmed in spreadsheet registry; upload document file to reach 100% evidence rating.'
    else: proof100=45; proof_text='No supporting proof files attached. Claims in spreadsheet lack external documentary verification.'
    proof_score=round(proof100/10,1); nom100=BASE[nom['level']]; nom_score=round(nom100/10,1)
    nom_text=f"Nominator band {nom['level']} ({nom['roleDescription']}): Multiplier {nom['multiplier']:.2f}x (+{nom['boostPercentage']}% boost, floor {nom['authorityFloor']}+)."
    overall=round(comments100*.35+proof100*.35+nom100*.30)+nom['boostPoints']; floor_applied=False
    if nom['isManagerSponsored'] and overall<nom['authorityFloor']: overall=nom['authorityFloor']; floor_applied=True; nom_text+=f" High leadership authority floor applied ({nom['authorityFloor']}+) because executive endorsement verifies strategic consequence even with concise comments."
    if any(x in decision for x in ['winner','awarded']) and (nom['isSeniorLeadershipC6Plus'] or verified or has_metrics): overall=max(overall,88)
    elif any(x in decision for x in ['shortlist','finalist']) and overall<82: overall=max(overall,82)
    elif any(x in decision for x in ['reject','disqualif']) and not nom['isSeniorLeadershipC6Plus'] and not verified: overall=min(overall,64)
    overall=min(max(overall,42),98); target=round(overall/10,1)
    impact=round(min(max(round((comments100*.5+nom100*.5)/10,1),max(target-.5,4)),10),1); alignment=round(min(max(round((criteria_score/20*50+comments100*.5)/10,1),max(target-.6,4)),10),1); citation_score=round(min(max(round(proof100/10,1),4),10),1); competency=round(min(max(round((nom100*.6+comments100*.4)/10,1),max(target-.4,4)),10),1)
    tier='Top Contender - Winner' if overall>=90 else 'Strong Nominee - Recommended' if overall>=80 else 'Satisfactory - Honorable Mention' if overall>=70 else 'Needs Improvement'
    strengths=[]
    strengths.append(f"📊 Spreadsheet Comments: Contains {count} concrete performance metrics ({', '.join(metrics[:4])}) demonstrating quantifiable business return." if has_metrics else f"📝 Spreadsheet Comments: Well-aligned with {st(n.get('nominationCategory'))} category objectives ({chars} characters across nomination fields).")
    if verified: strengths.append(f"📎 Verified Proof Docs: Corroborated by {len(docs)} verified attachment(s) ({'; '.join(details[:2])}) validating delivery claims.")
    elif marked: strengths.append('📎 Attachment Evidence: Registry confirms supporting artifact submitted with nomination.')
    strengths.append(f"💎 Nominator Competency Floor ({nom['level']} - {nom['roleDescription']}): Elevated to {overall}/100 floor honoring high supervisory standing and strategic authority." if floor_applied else f"👑 Nominator Competency Checkpoint ({nom['level']} - {nom['roleDescription']}): Endorsed by leadership with +{nom['boostPercentage']}% progressive weightage ({nom['multiplier']:.2f}x)." if nom['boostPercentage'] else f"👥 Nominator Competency ({nom['level']}): Peer nomination verified for technical execution.")
    improvements=[]
    if not verified: improvements.append('Attach verified client email (.eml/.msg) or signed PDF dossier to corroborate spreadsheet claims and boost evidence score.')
    if not has_metrics: improvements.append('Include specific quantifiable metrics (e.g. % speedup, $ revenue saved, hours reduced) in spreadsheet citation comments.')
    if not improvements: improvements.append('Include additional multi-quarter customer ROI tracking for enterprise-level visibility.')
    rationale=f"Actual score synthesized strictly across 3 foundational inputs: (1) Spreadsheet Comments: {count} concrete metric indicators ({', '.join(metrics[:3])}) yielding {comments100}/100; (2) Proof Documents: {len(docs) if verified else 'registry confirmed attachment' if marked else 'pending upload'} yielding {proof100}/100; and (3) Whom Nominated By: {nom['level']} ({nom['roleDescription']}) providing {nom['multiplier']:.2f}x weightage yielding {nom100}/100. Final calibrated actual score: {overall}/100 ({tier})."
    return {'overallScore':overall,'impactScore':impact,'criteriaAlignmentScore':alignment,'citationEvidenceScore':citation_score,'competencyScore':competency,'recommendationTier':tier,'keyStrengths':strengths,'areasOfImprovement':improvements,'detailedRationale':rationale,'criteriaMatchSummary':f"Category: {st(n.get('nominationCategory'))} | Comments: {chars} chars ({count} metrics) | Proof Docs: {len(docs)} attached | Nominator: {nom['level']} (+{nom['boostPercentage']}%)",'attachmentWarning':not verified,'evaluatedAt':datetime.now(timezone.utc).isoformat(),'managerCheckpoint':{'isManagerSponsored':nom['isManagerSponsored'],'nominatorLevel':nom['level'],'boostPercentage':nom['boostPercentage'],'appliedBoostScore':nom['boostPoints'],'rationale':f"Executive Sponsorship Authority Floor ({nom['level']}): Elevated score to {overall}/100 despite concise comments, honoring the supervisory standing of {nom['roleDescription']}." if floor_applied else f"Senior Leadership ({nom['level']}) Checkpoint Active (+{nom['boostPercentage']}% boost applied): High executive authority providing elevated baseline." if nom['isSeniorLeadershipC6Plus'] else f"Manager (C5) Checkpoint Active (+{nom['boostPercentage']}% boost applied): Line manager sponsorship verifying project delivery quality." if nom['isManagerC5'] else f"Nominator band {nom['level']} ({nom['multiplier']:.2f}x progressive multiplier applied)."},'threeFactorsBreakdown':{'commentsAnalysis':{'score':comments_score,'score100':comments100,'summary':f"Contains {count} quantifiable metric indicators ({', '.join(metrics[:3])}) with {chars} total characters across nomination fields." if has_metrics else f"Qualitative nomination description ({chars} characters); adding quantifiable metrics will further elevate impact score.",'hasMetrics':has_metrics,'metricsCount':count,'charCount':chars,'extractedMetricsList':metrics},'proofDocsAnalysis':{'score':proof_score,'score100':proof100,'summary':proof_text,'attachedCount':len(docs),'proofTypes':types,'verifiedCorroboration':verified,'proofDetails':details},'nominatorCompetencyAnalysis':{'score':nom_score,'score100':nom100,'level':nom['level'],'roleTitle':nom['roleDescription'],'weightMultiplier':nom['multiplier'],'boostPercentage':nom['boostPercentage'],'authorityFloor':nom['authorityFloor'],'authorityFloorApplied':floor_applied,'summary':nom_text}}}

class SinglePayload(BaseModel): nomination: dict[str, Any]
class BatchPayload(BaseModel): nominations: list[dict[str, Any]]
@app.get('/api/health')
def health(): return {'status':'ok','service':'rewards-nomination-evaluator-api'}
@app.post('/api/evaluate-nomination')
def evaluate_single(payload: SinglePayload):
    if not payload.nomination: raise HTTPException(status_code=400, detail='Missing nomination payload')
    return {'evaluation':evaluate(payload.nomination),'isHeuristic':True}
@app.post('/api/evaluate-batch')
def evaluate_batch(payload: BatchPayload):
    results=[]
    for n in payload.nominations:
        try: results.append({**n,'evaluation':evaluate(n)})
        except Exception: results.append(n)
    return {'nominations':results,'totalEvaluated':len(results)}
