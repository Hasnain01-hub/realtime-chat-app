import React from "react";
import { realtime } from "../../configs/Firebase";
import { toast, ToastContainer } from "react-toastify";
import firebase, { onValue, ref, update } from "firebase/database";
import "./helper.css";

// Force firebase database to use long polling instead of websockets
import { useNavigate } from "react-router-dom";
import Header from "../../layout/Slider";
import Nav from "../../layout/Nav";
import axios from "axios";

const Home = () => {
  const [userdata, setuserdata] = React.useState([]);
  const [messages_inp, setmessages_inp] = React.useState("");
  const [file, setFile] = React.useState(null);
  const [curr_user, setuser] = React.useState({});
  const [global_data, setglobal_data] = React.useState({});
  const [message, setmessage] = React.useState({});
  const [merge_msg, setMergeMessage] = React.useState([]);
  console.log(merge_msg, "merge_msg");
  React.useEffect(() => {
    let user = JSON.parse(window.localStorage.getItem("user"));
    if (user && user.name) {
      setuser(user);
      const query = ref(realtime, "allusers");
      return onValue(query, (snapshot) => {
        var raw_data = snapshot.val();

        if (snapshot.exists()) {
          console.log("data", raw_data["bob"]);
          if (!raw_data[user.name]) {
            console.log("not exist");
            var email = user.email;
            raw_data = {
              ...raw_data,
              [user.name]: {
                name: user.name,
                token: user.token,
                chats: [
                  {
                    name: user.name,
                    url: user.url,

                    messages: [
                      {
                        message: "",
                        sender: "bob",
                        time: "12:00",
                        content: "msg",
                        fileUrl: "",
                        fileType: "",
                      },
                    ],
                  },
                ],
              },
            };
            // ref(realtime,"allusers").set();
            update(ref(realtime, "allusers"), raw_data);
          }
          setglobal_data(raw_data);
          setuserdata(raw_data);
        }
      });
    }
  }, []);
  const handleChange = (event) => {
    setFile(event.target.files[0]);
  };
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
      // toast.success("Success: file saved");
      message.messages.push(file_data);
      merge_msg.push(file_data);
      let state_data = {
        ...global_data,
        [curr_user.name]: {
          ...global_data[curr_user.name],
          chats: [
            // ...global_data[curr_user.name].chats,
            {
              ...global_data[curr_user.name].chats[0],
              messages: [
                ...global_data[curr_user.name].chats[0].messages,
                file_data,
              ],
            },
          ],
        },
      };
      setglobal_data(state_data);

      update(ref(realtime, "allusers"), state_data);
      setFile(null);
      setmessages_inp("");
    } catch (error) {
      setFile(null);
      setmessages_inp("");
      console.log(error);
    }
  };

  const pushmessage = (e) => {
    console.log(file, "file");
    if (file !== null) {
      uploadAssets(e);
      return;
    }
    e.preventDefault();

    const data = {
      message: messages_inp,
      sender: curr_user.name,
      fileUrl: "",
      content: "msg",
      fileType: "",
      time: Date.now(),
    };

    message.messages.push(data);
    merge_msg.push(data);
    let state_data = {
      ...global_data,
      [curr_user.name]: {
        ...global_data[curr_user.name],
        chats: [
          // ...global_data[curr_user.name].chats,
          {
            ...global_data[curr_user.name].chats[0],
            messages: [...global_data[curr_user.name].chats[0].messages, data],
          },
        ],
      },
    };
    setglobal_data(state_data);
    console.log("global", state_data);
    update(ref(realtime, "allusers"), state_data);
    setmessages_inp("");
  };

  const setMessageScreen = (e, data) => {
    e.preventDefault();
    var arr = userdata[curr_user.name].chats[0]["messages"]?.filter((item) => {
      return item.sender == data.name;
    });
    var arr2 = userdata[data.name].chats[0]["messages"]?.filter((item) => {
      return item.sender == curr_user.name;
    });
    console.log(message, "message");
    if (arr.length == 0) {
      arr = [
        {
          message: "",
          sender: "",
          time: "",
          fileUrl: "",
          content: "",
        },
      ];
    }
    if (arr2.length == 0) {
      arr2 = [
        {
          message: "",
          sender: "",
          time: "",
          fileUrl: "",
          content: "",
        },
      ];
    }
    const mergedArray = [...arr, ...arr2];

    // Sort the merged array by 'time' in ascending order
    mergedArray.sort((a, b) => new Date(a.time) - new Date(b.time));

    setMergeMessage(mergedArray);

    console.log("arr", data.message);

    setmessage(data);
    // console.log("data", data);
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
      {console.log("jsjsjsjsj", global_data)}
      <div className="layout-wrapper layout-content-navbar">
        <div className="layout-container">
          <Header />
          <div className="layout-page">
            <Nav />

            <div className="container-xxl flex-grow-1 container-p-y">
              <div className="row">
                <div className="col-lg-12  order-1">
                  <div className="contacts">
                    <i className="fas fa-bars fa-2x mobile"></i>
                    <h2 className="mobile">Chats</h2>
                    <div className="contact">
                      {Object.values(userdata).map((item, id) => {
                        return item.name != curr_user.name ? (
                          <>
                            <div
                              key={id}
                              style={{ marginBottom: "50px" }}
                              className="mobile-bar"
                            >
                              <div
                                key={id}
                                onClick={(e) =>
                                  setMessageScreen(e, item.chats[0])
                                }
                                className="pic rogers"
                                // style={{
                                //   backgroundImage: `url(${item.chats[0]["url"]})`,
                                // }}

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
                                  src={item.chats[0]["url"]}
                                />
                              </div>

                              <div className="badge">1</div>
                              <div className="name">{item.name}</div>
                              <div className="message">
                                {item.chats[0]["messages"][0]["message"]}
                              </div>
                            </div>
                          </>
                        ) : null;
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
                        {/* <div className="seen">Today at 12:56</div> */}
                      </div>
                      <div className="messages" id="chat">
                        <div className="time">{message.messages[0].time}</div>

                        {merge_msg.length > 0
                          ? merge_msg?.map((item, index) => {
                              console.log("item", merge_msg);
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
                            })
                          : ""}
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
    </>
  );
};

export default Home;
