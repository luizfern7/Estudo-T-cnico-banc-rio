"""Atualiza somente assets web; exige APK original e assinatura posterior."""
import argparse
from pathlib import Path
from zipfile import ZipFile
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('original',type=Path)
parser.add_argument('output',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
assert args.original.resolve()!=args.output.resolve()
with ZipFile(args.original) as source,ZipFile(args.output,'w') as target:
    for entry in source.infolist():
        # Assinaturas antigas não são válidas após trocar os assets.
        if entry.filename.startswith('META-INF/'):
            continue
        content=(root/'index.html').read_bytes() if entry.filename=='assets/public/index.html' else source.read(entry)
        target.writestr(entry,content)
print('APK sem assinatura:',args.output)
