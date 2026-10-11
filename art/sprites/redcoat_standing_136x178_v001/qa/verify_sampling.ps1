# Independent PNG/source sampling check. Run from repository root.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
public static class SpriteSamplingVerifier {
  public static string Check(string source, string output, int x0, int y0,
    int sw, int sh, int dw, int dh, int ox, int oy, double phase) {
    using (var src = new Bitmap(source)) using (var dst = new Bitmap(output)) {
      if (dst.Width != 136 || dst.Height != 178) throw new Exception("Wrong native dimensions");
      int opaque = 0;
      for (int y=0; y<178; y++) for (int x=0; x<136; x++) {
        int expected = 0;
        if (x>=ox && x<ox+dw && y>=oy && y<oy+dh) {
          int sx=x0+Math.Min(sw-1,(int)Math.Floor((x-ox+phase)*sw/dw));
          int sy=y0+Math.Min(sh-1,(int)Math.Floor((y-oy+phase)*sh/dh));
          Color c=src.GetPixel(sx,sy);
          if (c.A>=128) expected=Color.FromArgb(255,c.R,c.G,c.B).ToArgb();
        }
        Color actual=dst.GetPixel(x,y);
        if(actual.ToArgb()!=expected) throw new Exception(String.Format("Source mismatch at ({0},{1})",x,y));
        if(actual.A==255) opaque++;
      }
      return String.Format("PASS: all 24208 pixels equal direct source sampling plus alpha normalization; {0} opaque and {1} transparent.",opaque,24208-opaque);
    }
  }
}
'@
$root=Join-Path (Get-Location) 'art/sprites/redcoat_standing_136x178_v001'
$specs=@(
  @{name='redcoat-standing';x=257;y=12;sw=610;sh=1419;dw=77;dh=178;ox=29;oy=0;phase=0.25}
)
$report=foreach($s in $specs) {
  $result=[SpriteSamplingVerifier]::Check(
    (Join-Path $root ('sources/'+$s.name+'.png')),
    (Join-Path $root ($s.name+'_136x178.png')),
    $s.x,$s.y,$s.sw,$s.sh,$s.dw,$s.dh,$s.ox,$s.oy,$s.phase)
  $s.name+': '+$result
}
$report | Set-Content -LiteralPath (Join-Path $root 'qa/source_sampling.txt') -Encoding UTF8
$report
