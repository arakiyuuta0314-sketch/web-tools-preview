from pathlib import Path
import re
base=Path(r'C:\Users\User\source\repos\web-tools-preview-a18-p6\a18\layout-test\tests')
dest=base/'p6_regression';dest.mkdir(exist_ok=True)
out=r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\10_P6_ストーリー統合実装'
files=['p4-p2-regression-e2e.py','p4-p2-fault-regression-e2e.py','p4-full-e2e.py','p4-fault-e2e.py']
for file in files:
 s=(base/file).read_text('utf-8')
 s=s.replace(r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\08_P4_Lv3-Lv6実装',out)
 s=s.replace('127.0.0.1:8894','127.0.0.1:8899')
 # P6 needs the opening to be skipped, but mandatory profile still runs.
 s=s.replace("document.getElementById('a18PlayerName')","document.getElementById('introSkipOpening')?.click();document.getElementById('a18PlayerName')")
 lines=[]
 for line in s.splitlines():
  if "document.getElementById('startTour').click()" in line:
   indent=line[:len(line)-len(line.lstrip())]
   obj='a' if 'a.ev(' in line else 'w'
   lines.append(indent+obj+'.wait("Boolean(document.getElementById(\'startTour\'))")')
   lines.append(line)
   lines.append(indent+obj+'.wait("window.__A18_SCENE_STUDY__.p2.persistent().progression.events.find(e=>e.id===\'intro-v1\')?.status===\'seen\'")')
  else:lines.append(line)
 s='\n'.join(lines)+'\n'
 s=s.replace("progression.events[0].status==='seen'","progression.events.find(e=>e.id==='lv2-v1').status==='seen'")
 s=s.replace("'events_exact_six',\"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length\",6","'events_exact_seven',\"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length\",7")
 s=s.replace("'still_no_duplicate',\"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length\",1","'still_no_duplicate',\"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length\",2")
 s=s.replace("kind+'_event_not_created',\"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length\",0","kind+'_event_not_created',\"window.__A18_SCENE_STUDY__.p2.persistent().progression.events.length\",1")
 (dest/file).write_text(s,'utf-8')
 print(file,'lines',len(lines))
