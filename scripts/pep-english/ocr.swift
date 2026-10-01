import Foundation
import CoreGraphics
import Vision
let args=CommandLine.arguments
let pdfURL=URL(fileURLWithPath:args[1]);let out=URL(fileURLWithPath:args[2],isDirectory:true)
try FileManager.default.createDirectory(at:out,withIntermediateDirectories:true)
guard let pdf=CGPDFDocument(pdfURL as CFURL) else {fatalError("PDF_OPEN_FAILED")}
let start=args.count>3 ? Int(args[3])! : 1
let end=args.count>4 ? min(Int(args[4])!,pdf.numberOfPages) : pdf.numberOfPages
for n in start...end {
 let dest=out.appendingPathComponent(String(format:"%03d.json",n))
 if FileManager.default.fileExists(atPath:dest.path){continue}
 try autoreleasepool {
  guard let page=pdf.page(at:n) else{return}
  let rect=page.getBoxRect(.mediaBox);let scale=2400.0/rect.height
  let w=Int(rect.width*scale),h=Int(rect.height*scale)
  let ctx=CGContext(data:nil,width:w,height:h,bitsPerComponent:8,bytesPerRow:0,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.setFillColor(CGColor(red:1,green:1,blue:1,alpha:1));ctx.fill(CGRect(x:0,y:0,width:w,height:h));ctx.scaleBy(x:scale,y:scale);ctx.drawPDFPage(page)
  let request=VNRecognizeTextRequest();request.recognitionLevel = .accurate;request.recognitionLanguages=["en-US"];request.usesLanguageCorrection=false
  let handler=VNImageRequestHandler(cgImage:ctx.makeImage()!,options:[:]);try handler.perform([request])
  let lines=(request.results ?? []).compactMap{obs -> [String:Any]? in
   guard let c=obs.topCandidates(1).first else{return nil};let b=obs.boundingBox
   return ["text":c.string,"confidence":c.confidence,"box":[b.origin.x,b.origin.y,b.width,b.height]]
  }
  let data=try JSONSerialization.data(withJSONObject:["page":n,"totalPages":pdf.numberOfPages,"lines":lines],options:[.sortedKeys,.prettyPrinted]);try data.write(to:dest)
 }
 if n%10==0 || n==end {print("\(pdfURL.lastPathComponent) \(n)/\(pdf.numberOfPages)");fflush(stdout)}
}
