import React, {useCallback, useEffect, useState} from "react";
import ReactDOM from "react-dom";
import styles from "./modalComponent.module.css"; 

export default function ModalComponent({ onClose, children, title }) {
    // create ref for the StyledModalWrapper component
    const modalWrapperRef = React.useRef();

    // check if the user has clicked inside or outside the modal
    // useCallback is used to store the function reference, so that on modal closure, the correct callback can be cleaned in window.removeEventListener
    const backDropHandler = useCallback(e => {
        if (!modalWrapperRef?.current?.contains(e.target)) {
            onClose();
        }
    }, []);

    useEffect(() => {
        // remove the event listener when the modal is closed
        return () => window.removeEventListener('click', backDropHandler);
    }, []);

    useEffect(() => {
        setTimeout(() => {
            window.addEventListener('click', backDropHandler);
        })
    }, [])

    const handleCloseClick = (e) => {
        e.preventDefault();
        onClose();
    };

    const modalContent = (
        <div className={styles.modalOverlay}>

          <div className={styles.modal} ref={modalWrapperRef}>
              <div className={styles.modalHeader}>
                  <a href="#" onClick={handleCloseClick}>
                      x
                  </a>
              </div>
              {title && <h1>{title}</h1>}
              <div className={styles.modalBody}>{children}</div>
          </div>
        </div>
    );

    return ReactDOM.createPortal(
        modalContent,
        document.getElementById("root")
    );
};
