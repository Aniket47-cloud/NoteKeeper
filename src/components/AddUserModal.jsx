import React, { useState } from "react";
import Modal from "react-modal";

const AddUserModal = ({ isOpen, onClose, onSave }) => {
  const [userName, setUserName] = useState("");

  const handleSave = () => {
    if (userName.trim() !== "") {
      onSave(userName);
      setUserName("");
    } else {
      toast.error("User name cannot be empty");
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} ariaHideApp={false}>
      <h2>Add User</h2>
      <input
        type="text"
        placeholder="Enter user name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </Modal>
  );
};

export default AddUserModal;

