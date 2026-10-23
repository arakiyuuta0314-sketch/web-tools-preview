from pathlib import Path
root=Path(r'C:\Users\User\source\repos\web-tools-preview-a18-p4\a18\layout-test\tests')
target=r'G:\マイドライブ\06.アプリ開発\03.開発・テスト\A18_パズル美術館\08_P4_Lv3-Lv6実装'
Path(target).mkdir(parents=True,exist_ok=True)
for old,new in [('p2-e2e.py','p4-p2-regression-e2e.py'),('p2-fault-e2e.py','p4-p2-fault-regression-e2e.py')]:
 text=(root/old).read_text('utf-8')
 text=text.replace('07_P2_Lv1-Lv2実装','08_P4_Lv3-Lv6実装')
 text=text.replace('8875','8894')
 text=text.replace('9248','9348')
 for i in range(9251,9256):text=text.replace(str(i),str(i+100))
 if old=='p2-fault-e2e.py':text=text.replace("with_name('p2-e2e.py')","with_name('p4-p2-regression-e2e.py')")
 (root/new).write_text(text,encoding='utf-8')
print('Prepared P4-local P2 regression copies; originals unchanged.')
