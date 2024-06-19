import React from "react";
import "./Note.css";
const Note = ({
  id,
  title,
  tagline,
  body,
  pinned,
  editHandler,
  pinHandler,
  deleteHandler,
}) => {
  const slicedtext = body.slice(0, 100);
  return (
    <div className={`note ${pinned ? "pinned" : ""} `}>
      <div onClick={() => editHandler(id, title, tagline, body)}>
        
        <div className="text">
          <h3>{title}</h3>
          <p>{tagline}</p>
        </div>
        <div className="note-body">{slicedtext}</div>
      </div>
      <div className="note-footer">
        <button onClick={() => deleteHandler(id)} className="save-button">
          Delete
        </button>
        <button onClick={() => pinHandler(id)} className="save-button">
          {pinned ? "Unpin" : "Pin"}
        </button>
      </div>
    </div>
  );
};

export default Note;
