import path from "path";
import fs from "fs";

// // Define the type for a single file object
// type FileObject = {
//   path: string;
// };

// // Define the type for the files parameter
// type Files = {
//   [fieldname: string]: File[];
// };

// export const clearfiles = (files: Files) => {
//   for (let file of Object.keys(files)) {
//     let some_file = files[file];
//     some_file.forEach((f:FileObject) => {
//       fs.unlinkSync(path.join(f.path)); // Delete file from disk
//     });
//   }
// };

// Define the type for a single Multer file object
type MulterFileObject = Express.Multer.File;

// Define the type for the files parameter
type Files = {
  [fieldname: string]: MulterFileObject[];
};

export const clearfiles = (files: Files | MulterFileObject[]) => {
  if (Array.isArray(files)) {
    files.forEach((f: MulterFileObject) => {
      fs.unlinkSync(path.join(f.path)); // Delete file from disk
    });
  } else {
    for (let file of Object.keys(files)) {
      let some_file = files[file];
      some_file.forEach((f: MulterFileObject) => {
        fs.unlinkSync(path.join(f.path)); // Delete file from disk
      });
    }
  }
};
