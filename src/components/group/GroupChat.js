import React from "react";
import { realtime } from "../../configs/Firebase";
import firebase, { onValue, ref, update } from "firebase/database";
import "../../components/layout/helper.css";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

// Force firebase database to use long polling instead of websockets
import { useNavigate } from "react-router-dom";
import Header from "../../layout/Slider";
import Nav from "../../layout/Nav";

const GroupChat = () => {
  const [grpdata, setgrpdata] = React.useState([]);
  const [file, setFile] = React.useState(null);
  const [messages_inp, setmessages_inp] = React.useState("");
  const [curr_user, setuser] = React.useState({});
  const [global_data, setglobal_data] = React.useState({});
  const [message, setmessage] = React.useState({});
  const nav = useNavigate();
  const handleChange = (event) => {
    setFile(event.target.files[0]);
  };
  React.useEffect(() => {
    let user = JSON.parse(window.localStorage.getItem("user"));
    if (user && user.name) {
      setuser(user);
      const query = ref(realtime, "group");
      return onValue(query, (snapshot) => {
        var raw_data = snapshot.val();

        if (snapshot.exists()) {
          if (!raw_data[user.name]) {
            console.log("not exist");
          }
          setglobal_data(raw_data);
          setgrpdata(raw_data);
        }
      });
    }
    nav("/");
  }, [nav]);

  const uploadAssets = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
            pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_API_KEY,
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          },
        }
      );
      const resData = await res.data;
      console.log(resData);
      let file_data = {
        message: messages_inp,
        sender: curr_user.name,
        fileUrl:
          "https://copper-gigantic-minnow-346.mypinata.cloud/ipfs/" +
          resData.IpfsHash,
        content: "file",
        fileType: file.type,
        time: resData.Timestamp,
      };
      message.chats[0]["messages"].push(file_data);

      let data = {
        ...global_data,
        [message.name]: {
          ...global_data[message.name],
          chats: [
            // ...global_data[message.name].chats,
            {
              ...global_data[message.name].chats[0],
              messages: [
                ...global_data[message.name].chats[0].messages,
                // file_data,
              ],
            },
          ],
        },
      };
      console.log(data);
      setglobal_data(data);

      update(ref(realtime, "group"), data);
      setFile(null);
      setmessages_inp("");
    } catch (error) {
      setFile(null);
      setmessages_inp("");
      console.log(error);
    }
  };
  const pushmessage = async (e) => {
    if (file !== null) {
      uploadAssets(e);
      return;
    }
    e.preventDefault();
    try {
      const data = {
        message: messages_inp,
        sender: curr_user.name,
        fileUrl: "",
        content: "msg",
        fileType: "",
        time: Date.now(),
      };
      message.chats[0]["messages"].push(data);
      console.log("msg data", message);
      const state_data = {
        ...global_data,
        [message.name]: {
          ...global_data[message.name],
          chats: [
            // ...global_data[message.name].chats,
            {
              // ...global_data[message.name].chats[0],
              messages: [...global_data[message.name].chats[0].messages],
            },
          ],
        },
      };
      setglobal_data(state_data);
      console.log(state_data, "state_data");
      await update(ref(realtime, "group"), state_data);
      setmessages_inp("");
    } catch (error) {
      setFile(null);
      setmessages_inp("");
      console.log(error);
    }
  };

  const setMessageScreen = (e, data) => {
    e.preventDefault();
    setmessage(data);
  };
  const renderFileContent = ({ item, curr_user }) => {
    switch (item.fileType) {
      case "image/png":
      case "image/jpeg":
      case "image/gif":
        return (
          <img
            src={item.fileUrl}
            alt={item.message}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        );
      case "application/pdf":
        return (
          <iframe
            src={item.fileUrl}
            title={item.message}
            style={{ width: "100%", height: "500px" }}
            frameBorder="0"
          />
        );
      default:
        return (
          <div>
            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
              Download File
            </a>
          </div>
        );
    }
  };
  return (
    <>
      <div className="layout-wrapper layout-content-navbar">
        <div className="layout-container">
          <Header />
          <div className="layout-page">
            <Nav />

            <div className="container-xxl flex-grow-1 container-p-y">
              <div className="row">
                <div className="col-lg-12 order-1">
                  <div>
                    <div className="contacts">
                      <i className="fas fa-bars fa-2x mobile"></i>
                      <h2 className="mobile">Chats</h2>
                      <div className="contact">
                        {Object.values(grpdata)?.map((item) => {
                          return (
                            item.members.includes(curr_user.name) && (
                              <>
                                <div
                                  style={{ marginBottom: "50px" }}
                                  className="mobile-bar"
                                >
                                  <div
                                    onClick={(e) => setMessageScreen(e, item)}
                                    className="pic rogers"

                                    // data-message={item.url}
                                  >
                                    <img
                                      alt=""
                                      style={{
                                        borderRadius: "50%",
                                        width: "70px",
                                        height: "70px",
                                      }}
                                      referrerPolicy="no-referrer"
                                      src={item.url}
                                    />
                                  </div>

                                  <div className="badge">1</div>
                                  <div className="name">{item.name}</div>
                                  <div className="message">
                                    {
                                      item.chats[0]["messages"][
                                        item.chats[0]["messages"].length - 1
                                      ]["message"]
                                    }
                                  </div>
                                </div>
                              </>
                            )
                          );
                        })}
                      </div>
                    </div>
                    {message.name ? (
                      <div className="chat">
                        <div className="contact bar">
                          <div
                            className="pic "
                            style={{ backgroundImage: `url(${message.url})` }}
                          ></div>
                          <div className="name">{message.name}</div>
                          <div className="seen">
                            Total Members {message.members.length}
                          </div>
                        </div>
                        <div className="messages" id="chat">
                          <div className="time">
                            {message.chats[0]["messages"][0]?.time ??
                              new Date().toLocaleString()}
                          </div>

                          {message.chats[0]["messages"].length > 0 &&
                            message.chats[0]["messages"]?.map((item) => {
                              return (
                                <>
                                  {item.content === "file" && (
                                    <div
                                      className={
                                        item.sender === curr_user.name
                                          ? `message parker`
                                          : "message stark"
                                      }
                                    >
                                      {renderFileContent({
                                        item,
                                        curr_user,
                                      })}
                                    </div>
                                  )}
                                  {item.message !== "" && (
                                    <div
                                      className={
                                        item.sender === curr_user.name
                                          ? "message parker"
                                          : "message stark"
                                      }
                                    >
                                      {item.message}
                                      <br />
                                      <span>{item.sender}</span>
                                    </div>
                                  )}{" "}
                                </>
                              );
                            })}
                          {messages_inp.length > 0 ? (
                            <div className="message stark">
                              <div className="typing typing-1"></div>
                              <div className="typing typing-2"></div>
                              <div className="typing typing-3"></div>
                            </div>
                          ) : (
                            ""
                          )}
                        </div>
                        <div className="input">
                          <input
                            onChange={(e) => setmessages_inp(e.target.value)}
                            placeholder="Type your message here!"
                            type="text"
                            value={messages_inp}
                          />
                          <input
                            id="file-input"
                            className="d-none"
                            type="file"
                            onChange={handleChange}
                            required
                          />
                          <label htmlFor="file-input">
                            <svg
                              // className="ri-send-plane-fill"
                              width="24"
                              className="m-2 cursor-pointer"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M14 13.5V8C14 5.79086 12.2091 4 10 4C7.79086 4 6 5.79086 6 8V13.5C6 17.0899 8.91015 20 12.5 20C16.0899 20 19 17.0899 19 13.5V4H21V13.5C21 18.1944 17.1944 22 12.5 22C7.80558 22 4 18.1944 4 13.5V8C4 4.68629 6.68629 2 10 2C13.3137 2 16 4.68629 16 8V13.5C16 15.433 14.433 17 12.5 17C10.567 17 9 15.433 9 13.5V8H11V13.5C11 14.3284 11.6716 15 12.5 15C13.3284 15 14 14.3284 14 13.5Z"></path>
                            </svg>
                          </label>
                          <i
                            onClick={pushmessage}
                            className="ri-send-plane-fill"
                          ></i>
                        </div>
                      </div>
                    ) : (
                      <div className="chat contact">
                        <div className="name startchat">
                          Click on a chat to start messaging{" "}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupChat;
